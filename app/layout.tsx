import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Card Tracker Pro | Live Market Comps',
  description: 'Track real-time trading card sales and market values',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
