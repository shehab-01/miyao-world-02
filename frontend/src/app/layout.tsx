import type { Metadata } from "next";
import { Caveat, Lato, Playfair_Display } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["300", "400", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "MIYAO WORLD",
  description: "Miyao World official store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${lato.variable} ${playfair.variable} ${caveat.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
