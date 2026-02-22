"use client";

import { useState, useEffect } from "react";

interface Ingredient {
  id: string;
  name: string;
  addedAt: string;
}

export default function InventairePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newItem, setNewItem] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("vide-placard-ingredients");
    if (stored) {
      setIngredients(JSON.parse(stored));
    }
  }, []);

  function save(updated: Ingredient[]) {
    setIngredients(updated);
    localStorage.setItem("vide-placard-ingredients", JSON.stringify(updated));
  }

  function addItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const item: Ingredient = {
      id: crypto.randomUUID(),
      name: trimmed,
      addedAt: new Date().toISOString(),
    };
    save([...ingredients, item]);
  }

  function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    addItem(newItem);
    setNewItem("");
  }

  function handleBulkAdd() {
    const lines = bulkText
      .split(/[\n,;]+/)
      .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);
    const newItems: Ingredient[] = lines.map((name) => ({
      id: crypto.randomUUID(),
      name,
      addedAt: new Date().toISOString(),
    }));
    save([...ingredients, ...newItems]);
    setBulkText("");
    setShowBulk(false);
  }

  function removeItem(id: string) {
    save(ingredients.filter((i) => i.id !== id));
  }

  function clearAll() {
    if (confirm("Supprimer tous les ingrédients ?")) {
      save([]);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-900 mb-1">
        Mon Inventaire
      </h1>
      <p className="text-amber-700 mb-6">
        {ingredients.length} ingrédient{ingredients.length !== 1 ? "s" : ""} en
        stock
      </p>

      {/* Ajout individuel */}
      <form onSubmit={handleAddSingle} className="flex gap-2 mb-3">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Ajouter un ingrédient..."
          className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
        >
          Ajouter
        </button>
      </form>

      {/* Ajout en lot */}
      <button
        onClick={() => setShowBulk(!showBulk)}
        className="text-sm text-amber-600 hover:text-amber-800 mb-4 underline"
      >
        {showBulk ? "Masquer" : "Coller une liste (depuis ChatGPT)"}
      </button>

      {showBulk && (
        <div className="mb-4">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Collez ici la liste extraite par ChatGPT... (un ingrédient par ligne, ou séparés par des virgules)"
            rows={6}
            className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white mb-2"
          />
          <button
            onClick={handleBulkAdd}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
          >
            Ajouter tout
          </button>
        </div>
      )}

      {/* Liste */}
      {ingredients.length === 0 ? (
        <div className="text-center py-12 text-amber-500">
          <p className="text-4xl mb-3">🗄️</p>
          <p>Vos placards sont vides !</p>
          <p className="text-sm mt-1">
            Ajoutez des ingrédients ou collez une liste.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2 mb-4">
            {ingredients.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-amber-200"
              >
                <span className="text-amber-900">{item.name}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 text-sm"
                  title="Supprimer"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={clearAll}
            className="text-sm text-red-400 hover:text-red-600 underline"
          >
            Tout supprimer
          </button>
        </>
      )}
    </div>
  );
}
