import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSalesScript } from "@/lib/openai";

type GenerateScriptPayload = {
  productId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as GenerateScriptPayload;
    const productId = payload.productId;

    if (!productId) {
      return NextResponse.json({ message: "productId é obrigatório." }, { status: 400 });
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
      return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
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

    return NextResponse.json(
      {
        message: "Roteiro gerado com sucesso.",
        productId: product.id,
        aiScript: script,
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
