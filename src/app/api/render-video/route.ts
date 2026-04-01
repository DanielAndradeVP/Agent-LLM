import { generateFinalVideo } from "../../../lib/videoGenerator";

type RenderVideoPayload = {
    productId?: string;
    webhookUrl?: string;
};

export async function POST(request: Request): Promise<Response> {
    try {
        const requestUrl = new URL(request.url);
        const payload = (await request.json().catch(() => ({}))) as RenderVideoPayload;
        const productId = payload.productId;
        const webhookUrl = payload.webhookUrl;

        if (!productId) {
            return Response.json({ message: "productId é obrigatório." }, { status: 400 });
        }

        const result = await generateFinalVideo(productId, {
            requestOrigin: requestUrl.origin,
            webhookUrl,
        });

        return Response.json(
            {
                message: "Renderização iniciada com sucesso.",
                productId,
                renderId: result.renderId,
                status: "GENERATING",
                progress: result.progress,
                videoUrl: result.videoUrl,
                webhookUrl: result.webhookUrl,
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
