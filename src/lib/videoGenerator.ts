import axios from "axios";
import { prisma } from "./prisma";

type CreatomateRenderResponse = {
    id: string;
    status: string;
    url?: string;
    output_url?: string;
};

type RenderProgress = {
    progress: number;
};

const CREATOMATE_API_URL = "https://api.creatomate.com/v1/renders";
const DEFAULT_MUSIC_URL =
    "https://cdn.creatomate.com/assets/audio/the-future-bass.mp3";

function buildWebhookUrl(input: {
    requestOrigin?: string;
    webhookOverride?: string;
}): string | undefined {
    if (input.webhookOverride) {
        return input.webhookOverride;
    }

    if (process.env.RENDER_WEBHOOK_URL) {
        return process.env.RENDER_WEBHOOK_URL;
    }

    if (!input.requestOrigin) {
        return undefined;
    }

    return `${input.requestOrigin}/api/render-video/webhook`;
}

function splitScriptIntoCaptions(script: string): string[] {
    const normalized = script
        .replace(/\r/g, "")
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (normalized.length > 0) {
        return normalized.slice(0, 6);
    }

    const bySentence = script
        .split(/[.!?]+/)
        .map((part) => part.trim())
        .filter(Boolean);

    return bySentence.slice(0, 6);
}

function buildTemplateModifications(input: {
    productImageUrl: string;
    script: string;
}): Record<string, unknown> {
    const captions = splitScriptIntoCaptions(input.script);

    return {
        format: "mp4",
        width: 1080,
        height: 1920,
        duration: 20,
        source: {
            output_format: "mp4",
            width: 1080,
            height: 1920,
            duration: 20,
            elements: [
                {
                    type: "image",
                    track: 1,
                    time: 0,
                    duration: 20,
                    source: input.productImageUrl,
                    fit: "cover",
                    width: "100%",
                    height: "100%",
                },
                {
                    type: "audio",
                    track: 2,
                    time: 0,
                    duration: 20,
                    source: DEFAULT_MUSIC_URL,
                    volume: "15%",
                },
                {
                    type: "voiceover",
                    track: 3,
                    time: 0,
                    duration: 20,
                    text: input.script,
                    provider: "elevenlabs",
                    voice: process.env.ELEVENLABS_VOICE_ID ?? "Rachel",
                    model: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
                },
                ...captions.map((line, index) => ({
                    type: "text",
                    track: 10 + index,
                    time: index * 3,
                    duration: 3,
                    text: line,
                    width: "86%",
                    x: "50%",
                    y: "82%",
                    x_anchor: "50%",
                    y_anchor: "50%",
                    font_family: "Montserrat",
                    font_size: 52,
                    fill_color: "#FFFFFF",
                    stroke_color: "#000000",
                    stroke_width: 3,
                    background_color: "rgba(0, 0, 0, 0.45)",
                    padding: 20,
                    text_align: "center",
                })),
            ],
        },
    };
}

export async function generateFinalVideo(
    productId: string,
    options?: {
        requestOrigin?: string;
        webhookUrl?: string;
    },
): Promise<{
    renderId: string;
    status: string;
    progress: number;
    videoUrl: string | null;
    webhookUrl: string | null;
}> {
    const apiKey = process.env.CREATOMATE_API_KEY;
    if (!apiKey) {
        throw new Error("CREATOMATE_API_KEY não configurada.");
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            imageUrl: true,
            aiScript: true,
        },
    });

    if (!product) {
        throw new Error("Produto não encontrado.");
    }

    if (!product.aiScript || !product.aiScript.trim()) {
        throw new Error("Produto sem roteiro IA. Gere o roteiro antes de renderizar.");
    }

    const webhookUrl = buildWebhookUrl({
        requestOrigin: options?.requestOrigin,
        webhookOverride: options?.webhookUrl,
    });
    const modifications = buildTemplateModifications({
        productImageUrl: product.imageUrl,
        script: product.aiScript,
    });

    await prisma.product.update({
        where: { id: productId },
        data: {
            videoStatus: "GENERATING",
            videoProgress: 5,
            videoUrl: null,
        },
    });

    const payload: Record<string, unknown> = {
        ...modifications,
        output_format: "mp4",
        metadata: {
            productId,
        },
    };

    if (webhookUrl) {
        payload.webhook_url = webhookUrl;
    }

    const { data } = await axios.post<CreatomateRenderResponse>(
        CREATOMATE_API_URL,
        payload,
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 60_000,
        },
    );

    await prisma.product.update({
        where: { id: productId },
        data: {
            renderJobId: data.id,
            videoStatus: "GENERATING",
            videoProgress: 15,
            videoUrl: data.url ?? data.output_url ?? null,
            webhookUrl: webhookUrl ?? null,
        },
    });

    return {
        renderId: data.id,
        status: data.status ?? "queued",
        progress: 15,
        videoUrl: data.url ?? data.output_url ?? null,
        webhookUrl: webhookUrl ?? null,
    };
}

export async function syncRenderStatusByJobId(
    renderJobId: string,
): Promise<RenderProgress> {
    const apiKey = process.env.CREATOMATE_API_KEY;
    if (!apiKey) {
        throw new Error("CREATOMATE_API_KEY não configurada.");
    }

    const { data } = await axios.get<CreatomateRenderResponse>(
        `${CREATOMATE_API_URL}/${renderJobId}`,
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            timeout: 60_000,
        },
    );

    const status = (data.status ?? "").toLowerCase();
    let nextProgress = 25;
    let nextVideoStatus: "GENERATING" | "COMPLETED" | "FAILED" = "GENERATING";
    let errorMessage: string | null = null;

    if (status === "succeeded" || status === "completed") {
        nextProgress = 100;
        nextVideoStatus = "COMPLETED";
    } else if (status === "failed" || status === "error") {
        nextProgress = 0;
        nextVideoStatus = "FAILED";
        errorMessage = "Renderização do vídeo falhou na Creatomate.";
    } else if (status === "rendering") {
        nextProgress = 70;
    } else if (status === "transcribing" || status === "uploading") {
        nextProgress = 45;
    }

    await prisma.product.updateMany({
        where: { renderJobId },
        data: {
            videoStatus: nextVideoStatus,
            videoProgress: nextProgress,
            videoUrl: data.url ?? data.output_url ?? undefined,
            videoError: errorMessage,
        },
    });

    return { progress: nextProgress };
}

export async function completeRenderFromWebhook(input: {
    renderId: string;
    status?: string;
    url?: string;
    error?: string;
    productId?: string;
}): Promise<void> {
    const status = (input.status ?? "").toLowerCase();
    const where =
        input.productId
            ? { OR: [{ renderJobId: input.renderId }, { id: input.productId }] }
            : { renderJobId: input.renderId };

    if (status === "succeeded" || status === "completed") {
        await prisma.product.updateMany({
            where,
            data: {
                videoStatus: "COMPLETED",
                videoProgress: 100,
                videoUrl: input.url ?? null,
            },
        });
        return;
    }

    if (status === "failed" || status === "error") {
        await prisma.product.updateMany({
            where,
            data: {
                videoStatus: "FAILED",
                videoProgress: 0,
                videoError: input.error ?? "Renderização falhou.",
            },
        });
        return;
    }

    await prisma.product.updateMany({
        where,
        data: {
            videoStatus: "GENERATING",
            videoProgress: 80,
        },
    });
}
