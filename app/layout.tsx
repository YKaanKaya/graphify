import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GraphFlow ETL Suite - Transform Tabular Data to Graph Databases",
  description: "GraphFlow ETL Suite dramatically simplifies migrating and syncing data from relational databases to graph platforms with intelligent schema mapping, transformations, and error explanations powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <header className="border-b border-gray-200 bg-white">
          <div className="container mx-auto p-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">GraphFlow ETL</span>
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
} 