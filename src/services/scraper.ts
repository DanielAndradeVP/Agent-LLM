import axios from "axios";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import StealthPlugin from "playwright-stealth";

export type ScraperSession = {
    browser: Browser;
    context: BrowserContext;
    page: Page;
};

/**
 * Base scaffold for the TikTok Shop scraper.
 * This returns a stealth-configured Playwright page and can be expanded
 * with login flow, product extraction, retries and persistence.
 */
export async function createScraperSession(): Promise<ScraperSession> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const stealth = new StealthPlugin();
    await stealth.apply(page);

    return { browser, context, page };
}

export async function closeScraperSession(session: ScraperSession): Promise<void> {
    await session.page.close();
    await session.context.close();
    await session.browser.close();
}

export async function checkHttpReachability(url: string): Promise<number> {
    const response = await axios.get(url, { timeout: 15000 });
    return response.status;
}
