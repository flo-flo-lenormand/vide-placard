import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API OpenAI non configurée" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucune photo fournie" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type || "image/jpeg";

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyse cette photo de placard / frigo / étagère de cuisine.

Extrais la liste de TOUS les ingrédients et produits alimentaires visibles.

Règles :
- Un ingrédient par ligne
- Noms simples et courts en français (ex: "Pâtes", "Riz", "Sauce tomate")
- Pas de marques, juste le type de produit
- Pas de numérotation, pas de tirets, juste le nom
- Si tu vois des boîtes de conserve, essaie de deviner le contenu

Réponds UNIQUEMENT avec la liste, un ingrédient par ligne.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const ingredients = raw
      .split("\n")
      .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);

    return NextResponse.json({ ingredients });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error.status === 401) {
      return NextResponse.json(
        { error: "Clé API OpenAI invalide." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: `Erreur : ${error.message || "Erreur inconnue"}` },
      { status: 500 }
    );
  }
}
