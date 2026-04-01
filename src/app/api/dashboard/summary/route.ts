import { prisma } from "../../../lib/prisma";
import { readRuntimeConfig } from "../../../lib/runtimeConfig";

export async function GET(): Promise<Response> {
    try {
        const [totalProducts, readyVideos, config] = await Promise.all([
            prisma.product.count({
                where: {
                    NOT: [{ productUrl: "__runtime_config__" }],
                },
            }),
            prisma.product.count({
                where: {
                    videoStatus: "COMPLETED",
                    NOT: [{ productUrl: "__runtime_config__" }],
                },
            }),
            readRuntimeConfig(),
        ]);

        return Response.json(
            {
                totalProducts,
                readyVideos,
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
