import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readRuntimeConfig } from "@/lib/runtimeConfig";

export async function GET(): Promise<NextResponse> {
    try {
        const [totalProducts, readyVideos, config] = await Promise.all([
            prisma.product.count({
                where: { NOT: [{ productUrl: "__runtime_config__" }] },
            }),
            prisma.product.count({
                where: {
                    videoStatus: "COMPLETED",
                    NOT: [{ productUrl: "__runtime_config__" }],
                },
            }),
            readRuntimeConfig(),
        ]);

        return NextResponse.json(
            {
                totalProducts,
                readyVideos,
                creditsAvailable: config.creditsAvailable,
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
