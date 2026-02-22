"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Wine {
  name: string;
  color: "rouge" | "blanc" | "rosé" | "pétillant";
  reason: string;
}

interface Recipe {
  title: string;
  prepTime: string;
  cookTime: string;
  usedIngredients: string[];
  toBuy: string[];
  steps: string[];
  wine: Wine;
}

const wineEmoji: Record<string, string> = {
  rouge: "🍷",
  blanc: "🥂",
  rosé: "🌸",
  pétillant: "🍾",
};

const wineColor: Record<string, string> = {
  rouge: "bg-red-50 text-red-800 border-red-200",
  blanc: "bg-yellow-50 text-yellow-800 border-yellow-200",
  rosé: "bg-pink-50 text-pink-800 border-pink-200",
  pétillant: "bg-amber-50 text-amber-800 border-amber-200",
};

export default function RecettesPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rawFallback, setRawFallback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("vide-placard-ingredients");
    if (stored) {
      const parsed = JSON.parse(stored);
      setIngredients(parsed.map((i: { name: string }) => i.name));
    }
  }, []);

  async function generateRecipes() {
    setLoading(true);
    setError("");
    setRecipes([]);
    setRawFallback("");

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la génération");
      }

      const data = await res.json();
      if (Array.isArray(data.recipes) && data.recipes.length > 0) {
        setRecipes(data.recipes);
      } else if (data.rawFallback) {
        setRawFallback(data.rawFallback);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes Recettes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recettes générées à partir de vos {ingredients.length} ingrédient
          {ingredients.length !== 1 ? "s" : ""}
        </p>
      </div>

      {ingredients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <span className="text-5xl mb-4">📝</span>
            <p className="font-medium">Aucun ingrédient en stock</p>
            <p className="text-sm mt-1">
              Ajoutez d&apos;abord des ingrédients dans votre inventaire.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Ingredients summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingrédients disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((name, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={generateRecipes}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Le chef et le sommelier réfléchissent...
              </span>
            ) : (
              "🍳 Générer des recettes"
            )}
          </Button>

          {error && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-4 text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Recipe cards */}
          {recipes.map((recipe, i) => (
            <RecipeCard key={i} recipe={recipe} index={i} />
          ))}

          {/* Fallback raw text if JSON parsing failed */}
          {rawFallback && (
            <Card>
              <CardContent className="pt-6 whitespace-pre-wrap text-sm">
                {rawFallback}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const labels = ["Entrée", "Plat principal", "Dessert"];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-wider">
          {labels[index] || `Recette ${index + 1}`}
        </CardDescription>
        <CardTitle className="text-xl">{recipe.title}</CardTitle>
        <div className="flex gap-3 text-sm text-muted-foreground mt-1">
          <span>⏱ Prépa {recipe.prepTime}</span>
          <span>🔥 Cuisson {recipe.cookTime}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ingredients used */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Ingrédients du placard
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.usedIngredients.map((ing, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {ing}
              </Badge>
            ))}
          </div>
        </div>

        {/* To buy */}
        {recipe.toBuy.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              À acheter
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recipe.toBuy.map((ing, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs border-dashed"
                >
                  {ing}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Steps */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Instructions
          </p>
          <ol className="space-y-2">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <Separator />

        {/* Wine pairing */}
        <div
          className={`rounded-lg border p-4 ${wineColor[recipe.wine.color] || "bg-muted"}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {wineEmoji[recipe.wine.color] || "🍷"}
            </span>
            <div>
              <p className="font-semibold text-sm">{recipe.wine.name}</p>
              <p className="text-xs mt-1 opacity-80">{recipe.wine.reason}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
