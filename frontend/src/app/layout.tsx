import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (from @fontsource) so dev/build never needs to reach Google Fonts
const lato = localFont({
  src: [
    { path: "./fonts/lato-latin-300-normal.woff2", weight: "300" },
    { path: "./fonts/lato-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/lato-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-lato",
});

const playfair = localFont({
  src: [
    { path: "./fonts/playfair-display-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/playfair-display-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-playfair",
});

const caveat = localFont({
  src: [
    { path: "./fonts/caveat-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/caveat-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-caveat",
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
