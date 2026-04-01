import { getEffectiveConfig } from "../../../lib/runtimeConfig";

export async function GET(): Promise<Response> {
    try {
        const config = await getEffectiveConfig();
        return Response.json(
            {
                hasOpenAI: Boolean(config.openaiApiKey),
                hasCreatomate: Boolean(config.creatomateApiKey),
                hasWebhookSecret: Boolean(config.creatomateWebhookSecret),
            },
            { status: 200 },
        );
    } catch {
        return Response.json(
            { message: "Ops! Verifique sua conexão ou configuração de API." },
            { status: 500 },
        );
    }
}
