import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vide-Placard",
  description: "Videz vos placards avec des recettes créatives",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
            >
              <span className="text-2xl">🍽️</span>
              <span>Vide-Placard</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Inventaire
              </Link>
              <Link
                href="/recettes"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Recettes
              </Link>
              <Link
                href="/sauvegardees"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Sauvegardées
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
