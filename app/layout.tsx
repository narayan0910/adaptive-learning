import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "./context";

export const metadata: Metadata = {
  title: "Adaptive Learning | CCA Group",
  description: "AI-powered adaptive learning for Class 6 Science",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'DM Sans', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
