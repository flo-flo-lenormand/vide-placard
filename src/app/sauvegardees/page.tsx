"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

interface SavedRecipe {
  id: string;
  title: string;
  prepTime: string;
  cookTime: string;
  usedIngredients: string[];
  unusedIngredients?: string[];
  toBuy: string[];
  steps: string[];
  wine: Wine;
  savedAt: string;
  course: string;
}

const courseConfig: Record<string, { label: string; emoji: string }> = {
  entree: { label: "Entrée", emoji: "\uD83E\uDD57" },
  plat: { label: "Plat principal", emoji: "\uD83C\uDF5D" },
  dessert: { label: "Dessert", emoji: "\uD83C\uDF70" },
};

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

function getSavedRecipes(): SavedRecipe[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("vide-placard-saved-recipes");
  return stored ? JSON.parse(stored) : [];
}

function removeSavedRecipe(id: string) {
  const saved = getSavedRecipes().filter((r) => r.id !== id);
  localStorage.setItem("vide-placard-saved-recipes", JSON.stringify(saved));
}

export default function SauvegardeesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);

  useEffect(() => {
    setRecipes(getSavedRecipes());
  }, []);

  function handleRemove(id: string) {
    removeSavedRecipe(id);
    setRecipes(getSavedRecipes());
  }

  function handleClearAll() {
    if (confirm("Supprimer toutes les recettes sauvegardées ?")) {
      localStorage.removeItem("vide-placard-saved-recipes");
      setRecipes([]);
    }
  }

  const grouped = recipes.reduce<Record<string, SavedRecipe[]>>((acc, r) => {
    const key = r.course || "autre";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const courseOrder = ["entree", "plat", "dessert"];
  const sortedKeys = Object.keys(grouped).sort(
    (a, b) => (courseOrder.indexOf(a) === -1 ? 99 : courseOrder.indexOf(a)) -
              (courseOrder.indexOf(b) === -1 ? 99 : courseOrder.indexOf(b))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Recettes sauvegardées
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {recipes.length} recette{recipes.length !== 1 ? "s" : ""} en
            mémoire
          </p>
        </div>
        {recipes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleClearAll}
          >
            Tout supprimer
          </Button>
        )}
      </div>

      {recipes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-4xl mb-4" role="img" aria-label="livre de recettes">
              &#x1F4D6;
            </p>
            <p className="font-medium">Aucune recette sauvegardée</p>
            <p className="text-sm mt-1">
              Générez des recettes et sauvegardez vos préférées.
            </p>
          </CardContent>
        </Card>
      ) : (
        sortedKeys.map((courseId) => {
          const config = courseConfig[courseId] || {
            label: courseId,
            emoji: "\uD83C\uDF7D",
          };
          return (
            <div key={courseId} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 pt-2">
                <span>{config.emoji}</span>
                {config.label}
                <span className="text-xs font-normal text-muted-foreground">
                  — {grouped[courseId].length} recette
                  {grouped[courseId].length !== 1 ? "s" : ""}
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {grouped[courseId].map((recipe) => (
                  <SavedRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onRemove={() => handleRemove(recipe.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function SavedRecipeCard({
  recipe,
  onRemove,
}: {
  recipe: SavedRecipe;
  onRemove: () => void;
}) {
  const wineKey = normalizeWineColor(recipe.wine.color);
  const savedDate = new Date(recipe.savedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-wider">
          Sauvegardée le {savedDate}
        </CardDescription>
        <CardTitle className="text-lg leading-snug">{recipe.title}</CardTitle>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          <span>Prépa {recipe.prepTime}</span>
          <span className="text-border">|</span>
          <span>Cuisson {recipe.cookTime}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
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

      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          Retirer de la bibliothèque
        </Button>
      </CardFooter>
    </Card>
  );
}
