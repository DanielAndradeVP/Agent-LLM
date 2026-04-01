import crypto from "node:crypto";
import { completeRenderFromWebhook } from "../../../../lib/videoGenerator";

type CreatomateWebhookPayload = {
    id?: string;
    status?: string;
    url?: string;
    output_url?: string;
    error?: string;
};

function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.CREATOMATE_WEBHOOK_SECRET;
    if (!secret) {
        // If no secret is configured, allow webhook in development.
        return true;
    }
    if (!signature) {
        return false;
    }

    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(request: Request): Promise<Response> {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-creatomate-signature");

        if (!verifyWebhookSignature(rawBody, signature)) {
            return Response.json({ message: "Assinatura do webhook inválida." }, { status: 401 });
        }

        const payload = JSON.parse(rawBody) as CreatomateWebhookPayload;
        if (!payload.id) {
            return Response.json({ message: "id do render é obrigatório." }, { status: 400 });
        }

        await completeRenderFromWebhook({
            renderId: payload.id,
            status: payload.status,
            url: payload.url ?? payload.output_url,
            error: payload.error,
        });

        return Response.json({ message: "Webhook processado com sucesso." }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro no webhook de renderização.";
        return Response.json({ message }, { status: 500 });
    }
}
