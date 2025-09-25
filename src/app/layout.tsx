import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import ReloadButton from "@/components/ReloadButton";
import { ThemeProvider } from "@/contexts/ThemeContext";

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
        <ThemeProvider>
          <ErrorBoundary pageName="Global Layout" fallback={
            <div className="min-h-screen bg-red-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error Global</h1>
                <p className="text-gray-600">Ha ocurrido un error en el layout principal</p>
                <ReloadButton />
              </div>
            </div>
          }>
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
