import { getEffectiveConfig, writeRuntimeConfig } from "../../../lib/runtimeConfig";

type SettingsPayload = {
    openaiApiKey?: string;
    creatomateApiKey?: string;
    creatomateWebhookSecret?: string;
    elevenlabsVoiceId?: string;
    elevenlabsModelId?: string;
    renderWebhookUrl?: string;
    creditsAvailable?: number;
};

export async function GET(): Promise<Response> {
    try {
        const config = await getEffectiveConfig();
        return Response.json(
            {
                openaiApiKey: config.openaiApiKey ?? "",
                creatomateApiKey: config.creatomateApiKey ?? "",
                creatomateWebhookSecret: config.creatomateWebhookSecret ?? "",
                elevenlabsVoiceId: config.elevenlabsVoiceId ?? "",
                elevenlabsModelId: config.elevenlabsModelId ?? "",
                renderWebhookUrl: config.renderWebhookUrl ?? "",
                creditsAvailable: config.creditsAvailable,
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

export async function PATCH(request: Request): Promise<Response> {
    try {
        const payload = (await request.json().catch(() => ({}))) as SettingsPayload;

        await writeRuntimeConfig({
            openaiApiKey: payload.openaiApiKey ?? null,
            creatomateApiKey: payload.creatomateApiKey ?? null,
            creatomateWebhookSecret: payload.creatomateWebhookSecret ?? null,
            elevenlabsVoiceId: payload.elevenlabsVoiceId ?? null,
            elevenlabsModelId: payload.elevenlabsModelId ?? null,
            renderWebhookUrl: payload.renderWebhookUrl ?? null,
            creditsAvailable: payload.creditsAvailable ?? 0,
        });

        return Response.json(
            {
                message: "Configurações salvas com sucesso.",
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
