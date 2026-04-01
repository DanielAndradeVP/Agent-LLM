import OpenAI from "openai";

export type ProductScriptInput = {
    title: string;
    price: string;
    description: string;
};

export async function generateSalesScript(productData: ProductScriptInput): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY não configurada no ambiente.");
    }
    const openai = new OpenAI({ apiKey });


    const { title, price, description } = productData;

    const prompt = [
        "Você é um copywriter especialista em TikTok Shop.",
        "Crie um roteiro de 20 segundos com um gancho (hook) forte nos primeiros 3 segundos, mostre o problema, a solução e uma chamada para ação (CTA) para o link na bio. Use linguagem persuasiva e direta.",
        "",
        `Produto: ${title}`,
        `Preço: ${price}`,
        `Descrição: ${description}`,
        "",
        "Responda em português do Brasil, em formato pronto para gravação, com marcação de tempo aproximada.",
    ].join("\n");

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
            {
                role: "system",
                content:
                    "Você cria roteiros curtos de vídeo com foco em conversão para e-commerce e TikTok Shop.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    const script = completion.choices[0]?.message?.content?.trim();
    if (!script) {
        throw new Error("A OpenAI não retornou roteiro para este produto.");
    }

    return script;
}
