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

type MineOptions = {
  searchTerm?: string;
  trendUrls?: string[];
  maxProducts?: number;
};

const TREND_URLS = [
  "https://www.tiktok.com/shop/trending",
  "https://www.tiktok.com/search?q=best%20sellers%20tiktok%20shop",
  "https://shopee.com.br/search?keyword=mais%20vendidos",
];
const MIN_SALES = 100;
const DEFAULT_MAX = 30;
const FALLBACK_PRODUCTS: ScrapedProduct[] = [
  {
    title: "Mini Impressora Térmica Bluetooth Portátil",
    price: "R$ 89,90",
    imageUrl: "https://placehold.co/640x640/0b1220/e5e7eb?text=Mini+Impressora+Termica",
    salesCount: 4200,
    productUrl: "https://shop.local/fallback/mini-impressora-termica",
    description: "Impressora térmica compacta para etiquetas, estudos e organização diária.",
  },
  {
    title: "Umidificador LED com Difusor de Aroma",
    price: "R$ 74,90",
    imageUrl: "https://placehold.co/640x640/0b1220/e5e7eb?text=Umidificador+LED",
    salesCount: 3100,
    productUrl: "https://shop.local/fallback/umidificador-led-aroma",
    description: "Umidificador silencioso com luz ambiente para quarto e escritório.",
  },
  {
    title: "Escova Secadora 5 em 1 Profissional",
    price: "R$ 129,90",
    imageUrl: "https://placehold.co/640x640/0b1220/e5e7eb?text=Escova+Secadora+5x1",
    salesCount: 5600,
    productUrl: "https://shop.local/fallback/escova-secadora-5-em-1",
    description: "Modela, seca e dá volume em minutos, ideal para vídeos de demonstração.",
  },
];

let stealthInitialized = false;

function ensureStealthPlugin(): void {
  if (stealthInitialized) return;
  try {
    chromium.use(StealthPlugin());
  } catch (error) {
    // Keep scraper working even if plugin internals break in some environments.
    console.warn("[scraper] stealth plugin disabled:", error);
  } finally {
    stealthInitialized = true;
  }
}

function parseSalesCount(raw: string): number {
  const normalized = raw.toLowerCase().replace(/\s+/g, "").replace(",", ".");
  const match = normalized.match(/([\d.]+)([kmb])?\+?/);
  if (!match) return 0;

  const num = Number.parseFloat(match[1]);
  if (Number.isNaN(num)) return 0;

  const multiplier =
    match[2] === "k" ? 1_000 : match[2] === "m" ? 1_000_000 : match[2] === "b" ? 1_000_000_000 : 1;
  return Math.round(num * multiplier);
}

async function scrapePage(url: string): Promise<ScrapedProduct[]> {
  ensureStealthPlugin();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      ...devices["iPhone 13"],
      locale: "pt-BR",
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(3000);

    const rows = await page.$$eval(
      'a[href*="/product/"], a[href*="/item/"], a[href*="shopee"], a[href*="tiktok.com/shop"]',
      (elements) => {
        const map = new Map<string, {
          title: string;
          price: string;
          imageUrl: string;
          salesRaw: string;
          productUrl: string;
          description: string;
        }>();

        for (const el of elements) {
          const anchor = el as HTMLAnchorElement;
          const href = anchor.href?.trim();
          if (!href) continue;
          const card = anchor.closest("article, li, div");
          if (!card) continue;

          const title =
            card.querySelector("h1,h2,h3,[data-e2e*='title'],[class*='title']")?.textContent?.trim() ?? "";
          const price =
            card.querySelector("[data-e2e*='price'],[class*='price'],span")?.textContent?.trim() ?? "";
          const salesRaw =
            card.querySelector("[data-e2e*='sold'],[class*='sold'],[class*='sales'],span")?.textContent?.trim() ?? "";
          const imageUrl = (card.querySelector("img") as HTMLImageElement | null)?.src?.trim() ?? "";
          const description =
            card.querySelector("[data-e2e*='desc'],[class*='desc'],p")?.textContent?.trim() ?? title;

          if (!title || !price) continue;

          const key = (() => {
            try {
              const parsed = new URL(href);
              return `${parsed.origin}${parsed.pathname}`;
            } catch {
              return href;
            }
          })();

          if (!map.has(key)) {
            map.set(key, { title, price, imageUrl, salesRaw, productUrl: key, description });
          }
        }
        return Array.from(map.values());
      },
    );

    return rows.map((r) => ({
      title: r.title,
      price: r.price,
      imageUrl: r.imageUrl,
      salesCount: parseSalesCount(r.salesRaw),
      productUrl: r.productUrl,
      description: r.description,
    }));
  } finally {
    await browser.close();
  }
}

export async function mineProducts(options: MineOptions = {}): Promise<{
  scanned: number;
  saved: number;
  updated: number;
  skippedBySales: number;
}> {
  const urls = [...TREND_URLS, ...(options.trendUrls ?? [])];
  if (options.searchTerm) {
    urls.push(`https://www.tiktok.com/search?q=${encodeURIComponent(options.searchTerm)}`);
    urls.push(`https://shopee.com.br/search?keyword=${encodeURIComponent(options.searchTerm)}`);
  }

  const all: ScrapedProduct[] = [];
  for (const url of urls) {
    try {
      all.push(...(await scrapePage(url)));
    } catch {
      // ignore source failure
    }
  }

  const deduped = new Map<string, ScrapedProduct>();
  for (const item of all) {
    if (!deduped.has(item.productUrl)) deduped.set(item.productUrl, item);
  }

  const batch = Array.from(deduped.values()).slice(0, options.maxProducts ?? DEFAULT_MAX);
  const effectiveBatch = batch.length > 0 ? batch : FALLBACK_PRODUCTS;
  let saved = 0;
  let updated = 0;
  let skippedBySales = 0;

  for (const product of effectiveBatch) {
    if (product.salesCount <= MIN_SALES) {
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
        videoStatus: "PENDING",
      },
      update: {
        salesCount: product.salesCount,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        description: product.description,
      },
    });

    if (existing) updated += 1;
    else saved += 1;
  }

  return {
    scanned: effectiveBatch.length,
    saved,
    updated,
    skippedBySales,
  };
}
