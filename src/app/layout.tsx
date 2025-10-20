import "../styles/globals.css";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import Link from "next/link";
import ClientInit from '@/components/ClientInit';

export const metadata = { title: "Finance App V1" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#content" className="skip-link focus:ring">Aller au contenu</a>

        {/* Top black header bar like your visual */}
        <div className="w-full bg-black text-white fixed top-0 left-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" aria-label="Accueil" className="focus-ring">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg font-bold">FA</div>
              </Link>
              <div className="hidden md:block text-sm font-medium">Finance App V1</div>
            </div>
            <div className="flex-1 px-6">
              <Nav />
            </div>
            <div className="flex items-center gap-3">
              <Link href="/settings/archived-envelopes" className="rounded-full p-2 bg-white/5 hover:bg-white/10">
                <span className="text-lg">⚙️</span>
              </Link>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 72 }} className="min-h-screen bg-surface text-gray-900">
          <div className="max-w-7xl mx-auto p-6">
            <ClientInit />
            <main id="content" role="main" className="space-y-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
