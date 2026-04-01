import { prisma } from "./prisma";

export type RuntimeConfig = {
  openaiApiKey: string | null;
  creatomateApiKey: string | null;
  creatomateWebhookSecret: string | null;
  elevenlabsVoiceId: string | null;
  elevenlabsModelId: string | null;
  renderWebhookUrl: string | null;
  creditsAvailable: number;
};

const DEFAULT_CREDITS = 100;

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function clampCredits(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_CREDITS;
  return Math.max(0, Math.floor(value));
}

async function getConfigRow() {
  return prisma.appConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      openaiApiKey: true,
      creatomateApiKey: true,
      creatomateWebhookSecret: true,
      elevenLabsVoiceId: true,
      elevenLabsModelId: true,
      renderWebhookUrl: true,
      creditsAvailable: true,
    },
  });
}

export async function readRuntimeConfig(): Promise<RuntimeConfig> {
  const row = await getConfigRow();
  return {
    openaiApiKey: emptyToNull(row?.openaiApiKey ?? null),
    creatomateApiKey: emptyToNull(row?.creatomateApiKey ?? null),
    creatomateWebhookSecret: emptyToNull(row?.creatomateWebhookSecret ?? null),
    elevenlabsVoiceId: emptyToNull(row?.elevenLabsVoiceId ?? null),
    elevenlabsModelId: emptyToNull(row?.elevenLabsModelId ?? null),
    renderWebhookUrl: emptyToNull(row?.renderWebhookUrl ?? null),
    creditsAvailable: clampCredits(row?.creditsAvailable),
  };
}

export async function writeRuntimeConfig(input: RuntimeConfig): Promise<void> {
  const existing = await getConfigRow();
  const payload = {
    openaiApiKey: emptyToNull(input.openaiApiKey),
    creatomateApiKey: emptyToNull(input.creatomateApiKey),
    creatomateWebhookSecret: emptyToNull(input.creatomateWebhookSecret),
    elevenLabsVoiceId: emptyToNull(input.elevenlabsVoiceId),
    elevenLabsModelId: emptyToNull(input.elevenlabsModelId),
    renderWebhookUrl: emptyToNull(input.renderWebhookUrl),
    creditsAvailable: clampCredits(input.creditsAvailable),
  };

  if (existing) {
    await prisma.appConfig.update({ where: { id: existing.id }, data: payload });
    return;
  }
  await prisma.appConfig.create({ data: payload });
}

export async function decrementCredits(amount = 1): Promise<number | null> {
  const existing = await getConfigRow();
  if (!existing) return null;

  const nextValue = Math.max(
    0,
    clampCredits(existing.creditsAvailable) - Math.max(0, amount),
  );
  await prisma.appConfig.update({
    where: { id: existing.id },
    data: { creditsAvailable: nextValue },
  });
  return nextValue;
}

export async function getEffectiveConfig(): Promise<RuntimeConfig> {
  const stored = await readRuntimeConfig();
  return {
    openaiApiKey: emptyToNull(process.env.OPENAI_API_KEY) ?? stored.openaiApiKey,
    creatomateApiKey:
      emptyToNull(process.env.CREATOMATE_API_KEY) ?? stored.creatomateApiKey,
    creatomateWebhookSecret:
      emptyToNull(process.env.CREATOMATE_WEBHOOK_SECRET) ??
      stored.creatomateWebhookSecret,
    elevenlabsVoiceId:
      emptyToNull(process.env.ELEVENLABS_VOICE_ID) ?? stored.elevenlabsVoiceId,
    elevenlabsModelId:
      emptyToNull(process.env.ELEVENLABS_MODEL_ID) ?? stored.elevenlabsModelId,
    renderWebhookUrl:
      emptyToNull(process.env.RENDER_WEBHOOK_URL) ?? stored.renderWebhookUrl,
    creditsAvailable: stored.creditsAvailable,
  };
}

export async function getConfigValue(
  key:
    | "OPENAI_API_KEY"
    | "CREATOMATE_API_KEY"
    | "CREATOMATE_WEBHOOK_SECRET"
    | "ELEVENLABS_VOICE_ID"
    | "ELEVENLABS_MODEL_ID"
    | "RENDER_WEBHOOK_URL",
): Promise<string | null> {
  const config = await getEffectiveConfig();
  const mapped: Record<typeof key, string | null> = {
    OPENAI_API_KEY: config.openaiApiKey,
    CREATOMATE_API_KEY: config.creatomateApiKey,
    CREATOMATE_WEBHOOK_SECRET: config.creatomateWebhookSecret,
    ELEVENLABS_VOICE_ID: config.elevenlabsVoiceId,
    ELEVENLABS_MODEL_ID: config.elevenlabsModelId,
    RENDER_WEBHOOK_URL: config.renderWebhookUrl,
  };
  return mapped[key];
}
