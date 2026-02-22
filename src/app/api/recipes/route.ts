import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API OpenAI non configurée" },
      { status: 500 }
    );
  }

  const { ingredients } = await req.json();
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      { error: "Aucun ingrédient fourni" },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `Tu es un chef cuisinier étoilé ET un sommelier expert. Tu proposes des recettes familiales délicieuses et tu accompagnes CHAQUE recette d'un accord vin parfait.

Ton objectif : proposer des recettes DÉLICIEUSES et RÉALISTES à partir des ingrédients disponibles, chacune avec une suggestion de vin.

Règles :
- Propose exactement 3 recettes variées (entrée ou plat léger, plat principal, dessert ou goûter si possible)
- Utilise PRINCIPALEMENT les ingrédients de la liste fournie
- Tu peux supposer que sel, poivre, huile et eau sont disponibles
- Si un ingrédient courant manque, mentionne-le comme "à acheter"
- Donne des proportions précises et des temps de cuisson réalistes
- Privilégie les recettes simples et savoureuses
- Pour chaque recette, suggère UN vin précis (appellation, couleur, et pourquoi il s'accorde bien)
- Rédige en français

Tu DOIS répondre avec un JSON valide, un tableau de 3 objets avec cette structure exacte :
[
  {
    "title": "Nom de la recette",
    "prepTime": "15 min",
    "cookTime": "25 min",
    "usedIngredients": ["ingrédient1", "ingrédient2"],
    "toBuy": ["ingrédient manquant"] ou [],
    "steps": ["Étape 1...", "Étape 2..."],
    "wine": {
      "name": "Nom du vin (Appellation)",
      "color": "rouge" | "blanc" | "rosé" | "pétillant",
      "reason": "Explication courte de l'accord"
    }
  }
]

Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.`,
      },
      {
        role: "user",
        content: `Voici les ingrédients disponibles :\n\n${ingredients.join(", ")}\n\nPropose-moi 3 recettes délicieuses avec accord vin.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "[]";

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const recipes = JSON.parse(cleaned);
    return NextResponse.json({ recipes });
  } catch {
    return NextResponse.json({ recipes: [], rawFallback: raw });
  }
}
