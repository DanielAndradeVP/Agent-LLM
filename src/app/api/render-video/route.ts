import { NextResponse } from "next/server";
import { generateFinalVideo } from "@/lib/videoGenerator";

type RenderPayload = {
  productId?: string;
  webhookUrl?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RenderPayload;
    if (!body.productId) {
      return NextResponse.json({ message: "productId é obrigatório." }, { status: 400 });
    }

    const requestUrl = new URL(request.url);
    const result = await generateFinalVideo(body.productId, {
      requestOrigin: requestUrl.origin,
      webhookUrl: body.webhookUrl,
    });

    return NextResponse.json(
      {
        message: "Renderização iniciada com sucesso.",
        productId: body.productId,
        renderId: result.renderId,
        status: "GENERATING",
        progress: result.progress,
        videoUrl: result.videoUrl,
        webhookUrl: result.webhookUrl,
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
