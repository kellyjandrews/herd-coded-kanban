import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Herd — Issue tracker",
  description: "Keep work moving with a simple, shared Kanban board.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
