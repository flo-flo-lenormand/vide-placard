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
      <body className="bg-amber-50 min-h-screen">
        <nav className="bg-white shadow-sm border-b border-amber-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-amber-800">
              🍽️ Vide-Placard
            </Link>
            <div className="flex gap-4">
              <Link
                href="/"
                className="text-amber-700 hover:text-amber-900 font-medium"
              >
                Inventaire
              </Link>
              <Link
                href="/recettes"
                className="text-amber-700 hover:text-amber-900 font-medium"
              >
                Recettes
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
