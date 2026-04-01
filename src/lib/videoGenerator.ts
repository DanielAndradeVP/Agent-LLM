import axios from "axios";
import { prisma } from "./prisma";
import { decrementCredits, getEffectiveConfig } from "./runtimeConfig";

type CreatomateRenderResponse = {
  id: string;
  status: string;
  url?: string;
  output_url?: string;
};

const CREATOMATE_API_URL = "https://api.creatomate.com/v1/renders";
const DEFAULT_MUSIC_URL =
  "https://cdn.creatomate.com/assets/audio/the-future-bass.mp3";

function buildWebhookUrl(input: {
  requestOrigin?: string;
  webhookOverride?: string;
  globalWebhookUrl?: string | null;
}): string | undefined {
  if (input.webhookOverride) {
    return input.webhookOverride;
  }
  if (input.globalWebhookUrl) {
    return input.globalWebhookUrl;
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

function buildTemplate(input: {
  productImageUrl: string;
  script: string;
  elevenLabsVoiceId?: string;
  elevenLabsModelId?: string;
}): Record<string, unknown> {
  const captions = splitScriptIntoCaptions(input.script);
  return {
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
        voice: input.elevenLabsVoiceId ?? "Rachel",
        model: input.elevenLabsModelId ?? "eleven_multilingual_v2",
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
  status: "GENERATING";
  progress: number;
  videoUrl: string | null;
  webhookUrl: string | null;
}> {
  const config = await getEffectiveConfig();
  if (!config.creatomateApiKey) {
    throw new Error("CREATOMATE_API_KEY não configurada.");
  }
  if (config.creditsAvailable <= 0) {
    throw new Error("Sem créditos disponíveis para renderizar novos vídeos.");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, imageUrl: true, aiScript: true },
  });
  if (!product) {
    throw new Error("Produto não encontrado.");
  }
  if (!product.aiScript?.trim()) {
    throw new Error("Produto sem roteiro IA. Gere o roteiro antes de renderizar.");
  }

  const webhookUrl = buildWebhookUrl({
    requestOrigin: options?.requestOrigin,
    webhookOverride: options?.webhookUrl,
    globalWebhookUrl: config.renderWebhookUrl,
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      videoStatus: "GENERATING",
      videoProgress: 5,
      videoUrl: null,
      videoError: null,
    },
  });

  const payload: Record<string, unknown> = {
    ...buildTemplate({
      productImageUrl: product.imageUrl,
      script: product.aiScript,
      elevenLabsVoiceId: config.elevenlabsVoiceId ?? undefined,
      elevenLabsModelId: config.elevenlabsModelId ?? undefined,
    }),
    metadata: { productId },
  };
  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
  }

  const { data } = await axios.post<CreatomateRenderResponse>(
    CREATOMATE_API_URL,
    payload,
    {
      headers: {
        Authorization: `Bearer ${config.creatomateApiKey}`,
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
  await decrementCredits(1);

  return {
    renderId: data.id,
    status: "GENERATING",
    progress: 15,
    videoUrl: data.url ?? data.output_url ?? null,
    webhookUrl: webhookUrl ?? null,
  };
}

export async function completeRenderFromWebhook(input: {
  renderId: string;
  status?: string;
  url?: string;
  error?: string;
  productId?: string;
}): Promise<void> {
  const status = (input.status ?? "").toLowerCase();
  const where = input.productId
    ? { OR: [{ renderJobId: input.renderId }, { id: input.productId }] }
    : { renderJobId: input.renderId };
  if (status === "succeeded" || status === "completed") {
    await prisma.product.updateMany({
      where,
      data: {
        videoStatus: "COMPLETED",
        videoProgress: 100,
        videoUrl: input.url ?? null,
        videoError: null,
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
    data: { videoStatus: "GENERATING", videoProgress: 80 },
  });
}
