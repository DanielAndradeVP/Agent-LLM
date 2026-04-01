import { prisma } from "../../../lib/prisma";

type ProductScriptUpdatePayload = {
    productId?: string;
    aiScript?: string;
};

export async function GET(): Promise<Response> {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                salesCount: "desc",
            },
            select: {
                id: true,
                title: true,
                price: true,
                description: true,
                imageUrl: true,
                salesCount: true,
                productUrl: true,
                aiScript: true,
                videoStatus: true,
            },
            take: 50,
        });

        return Response.json({ products }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar produtos.";
        return Response.json({ message }, { status: 500 });
    }
}

export async function PATCH(request: Request): Promise<Response> {
    try {
        const payload = (await request.json().catch(() => ({}))) as ProductScriptUpdatePayload;
        const productId = payload.productId;
        const aiScript = payload.aiScript;

        if (!productId) {
            return Response.json({ message: "productId é obrigatório." }, { status: 400 });
        }

        if (typeof aiScript !== "string") {
            return Response.json({ message: "aiScript deve ser uma string." }, { status: 400 });
        }

        const updated = await prisma.product.update({
            where: { id: productId },
            data: { aiScript },
            select: {
                id: true,
                aiScript: true,
            },
        });

        return Response.json(
            {
                message: "Roteiro atualizado com sucesso.",
                product: updated,
            },
            { status: 200 },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar roteiro.";
        return Response.json({ message }, { status: 500 });
    }
}
