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
        content: `Tu es un chef cuisinier expérimenté, spécialiste de la cuisine familiale française et internationale.

Ton objectif : proposer des recettes DÉLICIEUSES et RÉALISTES à partir des ingrédients disponibles.

Règles :
- Propose exactement 3 recettes variées (entrée ou plat léger, plat principal, dessert ou goûter si possible)
- Utilise PRINCIPALEMENT les ingrédients de la liste fournie
- Tu peux supposer que sel, poivre, huile et eau sont disponibles
- Si un ingrédient courant manque pour compléter une recette, mentionne-le clairement comme "à acheter"
- Donne des proportions précises et des temps de cuisson réalistes
- Privilégie les recettes simples et savoureuses, pas les recettes compliquées
- Rédige en français

Format pour chaque recette :
## [Nom de la recette]
**Temps de préparation :** X min | **Cuisson :** X min
**Ingrédients utilisés du placard :** liste
**À acheter (si besoin) :** liste ou "Rien !"

### Instructions
1. ...
2. ...

---`,
      },
      {
        role: "user",
        content: `Voici les ingrédients disponibles dans mes placards et frigo :\n\n${ingredients.join(", ")}\n\nPropose-moi 3 recettes délicieuses avec ces ingrédients.`,
      },
    ],
  });

  const recipes = completion.choices[0]?.message?.content || "";

  return NextResponse.json({ recipes });
}
