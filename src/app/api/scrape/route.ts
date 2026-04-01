import { mineTikTokShopProducts } from "../../../lib/scraper";

type ScrapeCommandPayload = {
    command?: string;
    term?: string;
    maxProducts?: number;
};

export async function POST(request: Request): Promise<Response> {
    try {
        const payload = (await request.json().catch(() => ({}))) as ScrapeCommandPayload;
        const searchTerm = payload.term ?? (payload.command === "best-sellers" ? "Best Sellers" : "Best Sellers");
        const maxProducts = payload.maxProducts ?? 30;

        const result = await mineTikTokShopProducts({ searchTerm, maxProducts });

        return Response.json(
            {
                message: "Mineração finalizada com sucesso.",
                scanned: result.scanned,
                saved: result.saved,
                updated: result.updated,
                skippedBySales: result.skippedBySales,
            },
            { status: 200 },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro inesperado no scraper.";
        return Response.json({ message }, { status: 500 });
    }
}
