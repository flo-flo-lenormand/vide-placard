"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Ingredient {
  id: string;
  name: string;
  addedAt: string;
}

export default function InventairePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newItem, setNewItem] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vide-placard-ingredients");
    if (stored) setIngredients(JSON.parse(stored));
  }, []);

  function save(updated: Ingredient[]) {
    setIngredients(updated);
    localStorage.setItem("vide-placard-ingredients", JSON.stringify(updated));
  }

  function addItems(names: string[]) {
    const newItems: Ingredient[] = names
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({
        id: crypto.randomUUID(),
        name,
        addedAt: new Date().toISOString(),
      }));
    if (newItems.length > 0) save([...ingredients, ...newItems]);
  }

  function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    addItems([newItem]);
    setNewItem("");
  }

  async function resizeImage(file: File, maxSize = 1200): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression échouée"))),
          "image/jpeg",
          0.8
        );
      };
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanPreview([]);

    const resized = await resizeImage(file).catch(() => file);
    const formData = new FormData();
    formData.append("photo", resized, "photo.jpg");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors du scan");
        return;
      }

      const data = await res.json();
      if (data.ingredients && data.ingredients.length > 0) {
        setScanPreview(data.ingredients);
      } else {
        alert("Aucun ingrédient détecté dans la photo.");
      }
    } catch {
      alert("Erreur de connexion lors du scan.");
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function confirmScanResults() {
    addItems(scanPreview);
    setScanPreview([]);
  }

  function removeScanItem(index: number) {
    setScanPreview(scanPreview.filter((_, i) => i !== index));
  }

  function removeItem(id: string) {
    save(ingredients.filter((i) => i.id !== id));
  }

  function clearAll() {
    if (confirm("Supprimer tous les ingrédients ?")) save([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon Inventaire</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ingredients.length} ingrédient{ingredients.length !== 1 ? "s" : ""} en
          stock
        </p>
      </div>

      {/* Photo scan — primary action */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={scanning}
        size="lg"
        className="w-full"
      >
        {scanning ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner /> Analyse en cours...
          </span>
        ) : (
          "Scanner un placard ou frigo"
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Scan preview */}
      {scanPreview.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">
              {scanPreview.length} ingrédient{scanPreview.length !== 1 ? "s" : ""} détecté{scanPreview.length !== 1 ? "s" : ""} :
            </p>
            <div className="flex flex-wrap gap-2">
              {scanPreview.map((name, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="gap-1.5 py-1.5 px-3 text-sm group"
                >
                  {name}
                  <button
                    onClick={() => removeScanItem(i)}
                    className="ml-0.5 text-muted-foreground hover:text-destructive"
                    aria-label={`Retirer ${name}`}
                  >
                    &#x2715;
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmScanResults} className="flex-1">
                Ajouter tout
              </Button>
              <Button
                variant="ghost"
                onClick={() => setScanPreview([])}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add single — secondary */}
      <form onSubmit={handleAddSingle} className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Ajouter un ingrédient manuellement..."
          className="flex-1"
        />
        <Button type="submit" variant="outline">Ajouter</Button>
      </form>

      {/* Ingredient list */}
      {ingredients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-4xl mb-4" role="img" aria-label="placard vide">
              &#x1F5C4;&#xFE0F;
            </p>
            <p className="font-medium">Vos placards sont vides !</p>
            <p className="text-sm mt-1">
              Prenez une photo de votre placard ou frigo pour commencer.
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
                  &#x2715;
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

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
