import { NextResponse } from "next/server";
import { getEffectiveConfig } from "@/lib/runtimeConfig";

export async function GET() {
  try {
    const config = await getEffectiveConfig();
    return NextResponse.json({
      hasOpenAI: Boolean(config.openaiApiKey),
      hasCreatomate: Boolean(config.creatomateApiKey),
      hasWebhookSecret: Boolean(config.creatomateWebhookSecret),
    });
  } catch {
    return NextResponse.json(
      { message: "Ops! Verifique sua conexão ou configuração de API." },
      { status: 500 },
    );
  }
}
