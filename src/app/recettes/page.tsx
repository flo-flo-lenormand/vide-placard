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
  color: string;
  reason: string;
}

interface Recipe {
  title: string;
  prepTime: string;
  cookTime: string;
  usedIngredients: string[];
  unusedIngredients?: string[];
  toBuy: string[];
  steps: string[];
  wine: Wine;
}

type RecipesByCourse = Record<string, Recipe[]>;

const courseConfig = [
  { id: "entree", label: "Entrée", emoji: "\uD83E\uDD57" },
  { id: "plat", label: "Plat principal", emoji: "\uD83C\uDF5D" },
  { id: "dessert", label: "Dessert", emoji: "\uD83C\uDF70" },
];

const wineEmoji: Record<string, string> = {
  rouge: "\uD83C\uDF77",
  blanc: "\uD83E\uDD42",
  rose: "\uD83C\uDF38",
  petillant: "\uD83C\uDF7E",
};

const wineColorStyle: Record<string, string> = {
  rouge: "bg-red-50 text-red-800 border-red-200",
  blanc: "bg-yellow-50 text-yellow-800 border-yellow-200",
  rose: "bg-pink-50 text-pink-800 border-pink-200",
  petillant: "bg-amber-50 text-amber-800 border-amber-200",
};

function normalizeWineColor(color: string): string {
  return color.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function RecettesPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipesByCourse | null>(null);
  const [rawFallback, setRawFallback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allowExtra, setAllowExtra] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    "entree",
    "plat",
    "dessert",
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("vide-placard-ingredients");
    if (stored) {
      const parsed = JSON.parse(stored);
      setIngredients(parsed.map((i: { name: string }) => i.name));
    }
  }, []);

  function toggleCourse(id: string) {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function generateRecipes() {
    if (selectedCourses.length === 0) return;
    setLoading(true);
    setError("");
    setRecipes(null);
    setRawFallback("");

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, allowExtra, courses: selectedCourses }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la génération");
      }

      if (data.recipes && typeof data.recipes === "object" && !Array.isArray(data.recipes)) {
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
          {ingredients.length} ingrédient{ingredients.length !== 1 ? "s" : ""} disponible{ingredients.length !== 1 ? "s" : ""}
        </p>
      </div>

      {ingredients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-4xl mb-4" role="img" aria-label="liste vide">
              &#x1F4DD;
            </p>
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

          {/* Course selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Je veux...</p>
            <div className="flex gap-2">
              {courseConfig.map((course) => (
                <button
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  className={`flex-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors ${
                    selectedCourses.includes(course.id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="block text-lg mb-0.5">{course.emoji}</span>
                  {course.label}
                </button>
              ))}
            </div>
          </div>

          {/* Extra ingredients toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allowExtra}
              onChange={(e) => setAllowExtra(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <div>
              <p className="text-sm font-medium">
                Autoriser des ingrédients supplémentaires
              </p>
              <p className="text-xs text-muted-foreground">
                Le chef pourra suggérer des ingrédients à acheter pour de meilleures recettes
              </p>
            </div>
          </label>

          <Button
            onClick={generateRecipes}
            disabled={loading || selectedCourses.length === 0}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Le chef et le sommelier réfléchissent...
              </span>
            ) : selectedCourses.length === 0 ? (
              "Sélectionnez au moins une catégorie"
            ) : (
              `Générer ${selectedCourses.length * 2} recettes`
            )}
          </Button>

          {error && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-4 text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Recipe results by course */}
          {recipes &&
            courseConfig
              .filter((c) => recipes[c.id])
              .map((course) => (
                <div key={course.id} className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 pt-2">
                    <span>{course.emoji}</span>
                    {course.label}
                    <span className="text-xs font-normal text-muted-foreground">
                      — 2 options
                    </span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {recipes[course.id].map((recipe: Recipe, i: number) => (
                      <RecipeCard
                        key={i}
                        recipe={recipe}
                        option={i + 1}
                      />
                    ))}
                  </div>
                </div>
              ))}

          {/* Fallback raw text */}
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

function RecipeCard({ recipe, option }: { recipe: Recipe; option: number }) {
  const wineKey = normalizeWineColor(recipe.wine.color);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-wider">
          Option {option}
        </CardDescription>
        <CardTitle className="text-lg leading-snug">{recipe.title}</CardTitle>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          <span>Prépa {recipe.prepTime}</span>
          <span className="text-border">|</span>
          <span>Cuisson {recipe.cookTime}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Ingredients used */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
            Ingrédients utilisés
          </p>
          <div className="flex flex-wrap gap-1">
            {recipe.usedIngredients.map((ing, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {ing}
              </Badge>
            ))}
          </div>
        </div>

        {/* Unused ingredients */}
        {recipe.unusedIngredients && recipe.unusedIngredients.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Non utilisés
            </p>
            <div className="flex flex-wrap gap-1">
              {recipe.unusedIngredients.map((ing, i) => (
                <Badge key={i} variant="outline" className="text-xs opacity-50">
                  {ing}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* To buy */}
        {recipe.toBuy.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              À acheter
            </p>
            <div className="flex flex-wrap gap-1">
              {recipe.toBuy.map((ing, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs border-dashed"
                >
                  + {ing}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Steps */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Instructions
          </p>
          <ol className="space-y-1.5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-xs font-semibold">
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
          className={`rounded-lg border p-3 ${wineColorStyle[wineKey] || "bg-muted border-border"}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-xl" role="img" aria-label="vin">
              {wineEmoji[wineKey] || "\uD83C\uDF77"}
            </span>
            <div>
              <p className="font-semibold text-sm">{recipe.wine.name}</p>
              <p className="text-xs mt-0.5 opacity-80">{recipe.wine.reason}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
