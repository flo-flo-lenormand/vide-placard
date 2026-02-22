"use client";

import { useState, useEffect } from "react";

export default function RecettesPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState("");
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
    setRecipes("");

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
      setRecipes(data.recipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-900 mb-1">Mes Recettes</h1>
      <p className="text-amber-700 mb-6">
        Recettes générées à partir de vos {ingredients.length} ingrédient
        {ingredients.length !== 1 ? "s" : ""}
      </p>

      {ingredients.length === 0 ? (
        <div className="text-center py-12 text-amber-500">
          <p className="text-4xl mb-3">📝</p>
          <p>Ajoutez d&apos;abord des ingrédients dans votre inventaire !</p>
        </div>
      ) : (
        <>
          {/* Résumé des ingrédients */}
          <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
            <h2 className="font-semibold text-amber-800 mb-2">
              Ingrédients disponibles :
            </h2>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((name, i) => (
                <span
                  key={i}
                  className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={generateRecipes}
            disabled={loading}
            className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {loading ? "Le chef réfléchit... 👨‍🍳" : "🍳 Générer des recettes"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {recipes && (
            <div className="bg-white rounded-lg border border-amber-200 p-6 prose prose-amber max-w-none">
              <RecipeContent content={recipes} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecipeContent({ content }: { content: string }) {
  // Simple markdown-like rendering
  const lines = content.split("\n");

  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-xl font-bold text-amber-900 mt-6 mb-2">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="text-lg font-semibold text-amber-800 mt-4 mb-2"
            >
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-amber-800 my-1">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (line.startsWith("**")) {
          const parts = line.split("**");
          return (
            <p key={i} className="my-1 text-amber-900">
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j}>{part}</strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          );
        }
        if (/^\d+\./.test(line)) {
          return (
            <p key={i} className="my-1 text-amber-900 pl-4">
              {line}
            </p>
          );
        }
        if (line === "---") {
          return <hr key={i} className="my-6 border-amber-200" />;
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="my-1 text-amber-900">
            {line}
          </p>
        );
      })}
    </div>
  );
}
