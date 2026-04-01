import { prisma } from "../../../lib/prisma";
import { generateSalesScript } from "../../../lib/openai";

type GenerateScriptPayload = {
    productId?: string;
};

export async function POST(request: Request): Promise<Response> {
    try {
        const payload = (await request.json().catch(() => ({}))) as GenerateScriptPayload;
        const productId = payload.productId;

        if (!productId) {
            return Response.json({ message: "productId é obrigatório." }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                title: true,
                price: true,
                description: true,
            },
        });

        if (!product) {
            return Response.json({ message: "Produto não encontrado." }, { status: 404 });
        }

        const script = await generateSalesScript({
            title: product.title,
            price: product.price,
            description: product.description,
        });

        await prisma.product.update({
            where: { id: product.id },
            data: { aiScript: script },
        });

        return Response.json(
            {
                message: "Roteiro gerado com sucesso.",
                productId: product.id,
                aiScript: script,
            },
            { status: 200 },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro inesperado ao gerar roteiro.";
        return Response.json({ message }, { status: 500 });
    }
}
