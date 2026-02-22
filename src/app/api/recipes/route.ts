import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API OpenAI non configurée. Vérifiez la variable d'environnement OPENAI_API_KEY dans les settings Vercel." },
      { status: 500 }
    );
  }

  const { ingredients, allowExtra, courses } = await req.json();
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      { error: "Aucun ingrédient fourni" },
      { status: 400 }
    );
  }

  const selectedCourses: string[] = courses || ["entree", "plat", "dessert"];

  const courseLabels: Record<string, string> = {
    entree: "entrée",
    plat: "plat principal",
    dessert: "dessert",
  };

  const courseList = selectedCourses.map((c: string) => courseLabels[c] || c).join(", ");
  const recipeCount = selectedCourses.length * 2;

  const extraRule = allowExtra
    ? `- Tu PEUX ajouter des ingrédients supplémentaires pour rendre les recettes meilleures. Place ces ingrédients ajoutés dans le champ "toBuy" pour que l'utilisateur sache quoi acheter.
- Sois créatif : n'hésite pas à compléter avec des ingrédients frais (herbes, légumes, crème, fromage, etc.) pour que les recettes soient vraiment savoureuses.`
    : `- Utilise UNIQUEMENT les ingrédients de la liste fournie. Ajoute le minimum absolu au champ "toBuy" seulement si c'est indispensable.`;

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `Tu es un chef cuisinier étoilé ET un sommelier expert. Tu proposes des recettes familiales délicieuses et tu accompagnes CHAQUE recette d'un accord vin parfait.

Règles :
- L'utilisateur a choisi ces catégories : ${courseList}
- Pour CHAQUE catégorie choisie, propose exactement 2 options différentes (pour que l'utilisateur puisse choisir)
- Cela fait ${recipeCount} recettes au total
- Tu peux supposer que sel, poivre, huile et eau sont disponibles
${extraRule}
- Donne des proportions précises et des temps de cuisson réalistes
- Privilégie les recettes simples et savoureuses
- Pour chaque recette, suggère UN vin précis (appellation, couleur, et pourquoi il s'accorde bien)
- Rédige en français
- IMPORTANT : dans "unusedIngredients", liste les ingrédients de l'inventaire qui ne sont utilisés dans AUCUNE des recettes de cette catégorie

Tu DOIS répondre avec un JSON valide structuré par catégorie :
{
${selectedCourses.map((c: string) => `  "${c}": [
    {
      "title": "Nom de la recette",
      "prepTime": "15 min",
      "cookTime": "25 min",
      "usedIngredients": ["ingrédient1", "ingrédient2"],
      "unusedIngredients": ["ingrédient non utilisé 1", "ingrédient non utilisé 2"],
      "toBuy": [],
      "steps": ["Étape 1...", "Étape 2..."],
      "wine": {
        "name": "Nom du vin (Appellation)",
        "color": "rouge",
        "reason": "Explication courte de l'accord"
      }
    },
    { ... deuxième option ... }
  ]`).join(",\n")}
}

Pour le champ "color" du vin, utilise UNIQUEMENT : "rouge", "blanc", "rose", "petillant".

Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.`,
        },
        {
          role: "user",
          content: `Voici les ingrédients disponibles :\n\n${ingredients.join(", ")}\n\nPropose-moi 2 options par catégorie (${courseList}) avec accord vin.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const recipes = JSON.parse(cleaned);
      return NextResponse.json({ recipes });
    } catch {
      return NextResponse.json({ recipes: null, rawFallback: raw });
    }
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error.status === 401) {
      return NextResponse.json(
        { error: "Clé API OpenAI invalide. Vérifiez votre clé dans les settings Vercel (Settings → Environment Variables → OPENAI_API_KEY)." },
        { status: 401 }
      );
    }
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Limite d'appels API dépassée. Réessayez dans quelques instants." },
        { status: 429 }
      );
    }
    if (error.status === 402 || (error.message && error.message.includes("billing"))) {
      return NextResponse.json(
        { error: "Crédit API OpenAI insuffisant. Vérifiez votre compte de facturation sur platform.openai.com." },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: `Erreur OpenAI : ${error.message || "Erreur inconnue"}` },
      { status: 500 }
    );
  }
}
