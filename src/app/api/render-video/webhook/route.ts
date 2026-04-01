import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { completeRenderFromWebhook } from "@/lib/videoGenerator";
import { getConfigValue } from "@/lib/runtimeConfig";

type CreatomateWebhookPayload = {
  id?: string;
  status?: string;
  url?: string;
  output_url?: string;
  error?: string;
  metadata?: {
    productId?: string;
  };
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-creatomate-signature");
    const secret = await getConfigValue("CREATOMATE_WEBHOOK_SECRET");

    if (secret && signature) {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const isValid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
      if (!isValid) {
        return NextResponse.json({ message: "Assinatura do webhook inválida." }, { status: 401 });
      }
    } else if (secret && !signature) {
      return NextResponse.json({ message: "Assinatura do webhook inválida." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as CreatomateWebhookPayload;
    if (!payload.id) {
      return NextResponse.json({ message: "id do render é obrigatório." }, { status: 400 });
    }

    await completeRenderFromWebhook({
      renderId: payload.id,
      status: payload.status,
      url: payload.url ?? payload.output_url,
      error: payload.error,
      productId: payload.metadata?.productId,
    });

    return NextResponse.json({ message: "Webhook processado com sucesso." }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Ops! Verifique sua conexão ou configuração de API." },
      { status: 500 },
    );
  }
}
