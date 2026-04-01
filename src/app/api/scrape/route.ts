import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ScrapePayload = {
  command?: string;
  term?: string;
  maxProducts?: number;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as ScrapePayload;
    const term = payload.term ?? (payload.command === "best-sellers" ? "Best Sellers" : "Best Sellers");
    const maxProducts = payload.maxProducts ?? 30;

    const { mineProducts } = await import("@/lib/scraper");
    const result = await mineProducts({ searchTerm: term, maxProducts });

    return NextResponse.json(
      {
        message: "Mineração finalizada com sucesso.",
        scanned: result.scanned,
        saved: result.saved,
        updated: result.updated,
        skippedBySales: result.skippedBySales,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Ops! Verifique sua conexão ou configuração de API." },
      { status: 500 },
    );
  }
}
