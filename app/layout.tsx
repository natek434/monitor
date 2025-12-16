import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100">
        <div className="min-h-screen max-w-7xl mx-auto px-6 py-8">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 font-bold">HM</div>
              <div>
                <div className="text-xl font-semibold">Homelab Admin Monitor</div>
                <p className="text-sm text-slate-400">n8n-powered checks with AI safety rails</p>
              </div>
            </div>
            <nav className="flex gap-4 text-sm font-medium text-slate-300">
              <Link className="hover:text-white" href="/admin/overview">Overview</Link>
              <Link className="hover:text-white" href="/admin/monitors">Monitors</Link>
              <Link className="hover:text-white" href="/admin/chat">Chat</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
