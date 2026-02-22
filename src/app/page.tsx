"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    if (stored) setIngredients(JSON.parse(stored));
  }, []);

  function save(updated: Ingredient[]) {
    setIngredients(updated);
    localStorage.setItem("vide-placard-ingredients", JSON.stringify(updated));
  }

  function addItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    save([
      ...ingredients,
      { id: crypto.randomUUID(), name: trimmed, addedAt: new Date().toISOString() },
    ]);
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
    if (confirm("Supprimer tous les ingrédients ?")) save([]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon Inventaire</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ingredients.length} ingrédient{ingredients.length !== 1 ? "s" : ""} en
          stock
        </p>
      </div>

      {/* Add single */}
      <form onSubmit={handleAddSingle} className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Ajouter un ingrédient..."
          className="flex-1"
        />
        <Button type="submit">Ajouter</Button>
      </form>

      {/* Bulk add toggle */}
      <Button
        variant="link"
        className="h-auto p-0 text-muted-foreground"
        onClick={() => setShowBulk(!showBulk)}
      >
        {showBulk
          ? "Masquer"
          : "📋 Coller une liste (depuis ChatGPT)"}
      </Button>

      {showBulk && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Collez ici la liste extraite par ChatGPT...\nUn ingrédient par ligne, ou séparés par des virgules."}
              rows={5}
            />
            <Button onClick={handleBulkAdd} className="w-full">
              Ajouter tout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ingredient list */}
      {ingredients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <span className="text-5xl mb-4">🗄️</span>
            <p className="font-medium">Vos placards sont vides !</p>
            <p className="text-sm mt-1">
              Ajoutez des ingrédients ou collez une liste.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ingredients.map((item) => (
              <Badge
                key={item.id}
                variant="secondary"
                className="gap-1.5 py-1.5 px-3 text-sm cursor-default group"
              >
                {item.name}
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  aria-label={`Supprimer ${item.name}`}
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={clearAll}
          >
            Tout supprimer
          </Button>
        </div>
      )}
    </div>
  );
}
