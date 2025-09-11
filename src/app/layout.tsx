import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ChileHome - Contratos",
  description: "Plataforma profesional de generación y validación de contratos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="chilehome" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/dashboard-styles.css" />
        <link rel="stylesheet" href="/daisyui-fix.css" />
        <link rel="stylesheet" href="/date-inputs.css" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
