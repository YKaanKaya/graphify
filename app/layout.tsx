import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
        <main>{children}</main>
      </body>
    </html>
  );
} 