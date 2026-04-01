import { devices } from "playwright";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { prisma } from "./prisma";

type ScrapedProduct = {
    title: string;
    price: string;
    imageUrl: string;
    salesCount: number;
    productUrl: string;
    description: string;
};

const TIKTOK_TREND_URLS = [
    "https://www.tiktok.com/shop/trending",
    "https://www.tiktok.com/search?q=best%20sellers%20tiktok%20shop",
];

const MIN_SALES_COUNT = 100;
const MAX_PRODUCTS_PER_RUN = 30;

chromium.use(StealthPlugin());

function normalizeProductUrl(url: string): string {
    try {
        const parsed = new URL(url);
        return `${parsed.origin}${parsed.pathname}`;
    } catch {
        return url;
    }
}

function parseSalesCount(rawValue: string): number {
    const normalized = rawValue.toLowerCase().replace(/\s+/g, "").replace(",", ".");
    const match = normalized.match(/([\d.]+)([kmb])?\+?/);

    if (!match) {
        return 0;
    }

    const numeric = Number.parseFloat(match[1]);
    if (Number.isNaN(numeric)) {
        return 0;
    }

    const multiplier = match[2] === "k" ? 1_000 : match[2] === "m" ? 1_000_000 : match[2] === "b" ? 1_000_000_000 : 1;
    return Math.round(numeric * multiplier);
}

async function scrapeFromPage(url: string): Promise<ScrapedProduct[]> {
    const browser = await chromium.launch({ headless: true });

    try {
        const context = await browser.newContext({
            ...devices["iPhone 13"],
            locale: "en-US",
            timezoneId: "UTC",
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.waitForTimeout(3_000);

        const products = await page.$$eval(
            'a[href*="/product/"], a[href*="tiktok.com/shop/product"]',
            (elements) => {
                const uniqueByUrl = new Map<string, {
                    title: string;
                    price: string;
                    imageUrl: string;
                    salesRaw: string;
                    productUrl: string;
                    description: string;
                }>();

                for (const element of elements) {
                    const anchor = element as HTMLAnchorElement;
                    const card = anchor.closest("article, div");
                    if (!card) {
                        continue;
                    }

                    const href = anchor.href?.trim();
                    if (!href) {
                        continue;
                    }

                    const titleNode =
                        card.querySelector('[data-e2e*="title"]') ??
                        card.querySelector("h3") ??
                        card.querySelector("h2") ??
                        card.querySelector("p");
                    const priceNode = card.querySelector('[data-e2e*="price"], [class*="price"], span');
                    const salesNode = card.querySelector('[data-e2e*="sold"], [class*="sold"], [class*="sales"], span');
                    const imageNode = card.querySelector("img");
                    const descriptionNode = card.querySelector('[data-e2e*="desc"], [class*="desc"], p');

                    const title = titleNode?.textContent?.trim() ?? "";
                    const price = priceNode?.textContent?.trim() ?? "";
                    const salesRaw = salesNode?.textContent?.trim() ?? "";
                    const imageUrl = (imageNode as HTMLImageElement | null)?.src?.trim() ?? "";
                    const description = descriptionNode?.textContent?.trim() ?? title;

                    if (!title || !price || !href) {
                        continue;
                    }

                    const normalizedHref = (() => {
                        try {
                            const parsed = new URL(href);
                            return `${parsed.origin}${parsed.pathname}`;
                        } catch {
                            return href;
                        }
                    })();

                    if (!uniqueByUrl.has(normalizedHref)) {
                        uniqueByUrl.set(normalizedHref, {
                            title,
                            price,
                            imageUrl,
                            salesRaw,
                            productUrl: normalizedHref,
                            description,
                        });
                    }
                }

                return Array.from(uniqueByUrl.values());
            },
        );

        return products.map((item) => ({
            title: item.title,
            price: item.price,
            imageUrl: item.imageUrl,
            salesCount: parseSalesCount(item.salesRaw),
            productUrl: item.productUrl,
            description: item.description,
        }));
    } finally {
        await browser.close();
    }
}

export async function mineTikTokShopProducts(input?: {
    searchTerm?: string;
    trendUrls?: string[];
    maxProducts?: number;
} | string): Promise<{
    scanned: number;
    saved: number;
    updated: number;
    skippedBySales: number;
}> {
    const parsedInput = typeof input === "string" ? { searchTerm: input } : input;
    const searchTerm = parsedInput?.searchTerm ?? "Best Sellers";
    const maxProducts = parsedInput?.maxProducts ?? MAX_PRODUCTS_PER_RUN;
    const dynamicSearchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(searchTerm)}`;
    const candidateUrls = [...TIKTOK_TREND_URLS, ...(parsedInput?.trendUrls ?? []), dynamicSearchUrl];

    const collected: ScrapedProduct[] = [];
    for (const targetUrl of candidateUrls) {
        try {
            const extracted = await scrapeFromPage(targetUrl);
            collected.push(...extracted.map((item) => ({ ...item, productUrl: normalizeProductUrl(item.productUrl) })));
        } catch {
            // Keep crawling the remaining endpoints if one source fails.
        }
    }

    const deduped = new Map<string, ScrapedProduct>();
    for (const item of collected) {
        if (!deduped.has(item.productUrl)) {
            deduped.set(item.productUrl, item);
        }
    }

    const finalBatch = Array.from(deduped.values()).slice(0, maxProducts);
    let saved = 0;
    let updated = 0;
    let skippedBySales = 0;

    for (const product of finalBatch) {
        if (product.salesCount <= MIN_SALES_COUNT) {
            skippedBySales += 1;
            continue;
        }

        const existing = await prisma.product.findUnique({
            where: { productUrl: product.productUrl },
            select: { id: true },
        });

        await prisma.product.upsert({
            where: { productUrl: product.productUrl },
            create: {
                title: product.title,
                price: product.price,
                imageUrl: product.imageUrl,
                salesCount: product.salesCount,
                productUrl: product.productUrl,
                description: product.description,
                aiScript: "",
                videoStatus: "PENDING",
            },
            update: {
                salesCount: product.salesCount,
            },
        });

        if (existing) {
            updated += 1;
        } else {
            saved += 1;
        }
    }

    return {
        scanned: finalBatch.length,
        saved,
        updated,
        skippedBySales,
    };
}
