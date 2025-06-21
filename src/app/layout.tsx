import { Inter } from "next/font/google";
import { Header } from "./_components/common/Header";
import { Footer } from "./_components/common/Footer";
import { Providers } from "./providers";
import "~/styles/globals.css";
import { Toaster } from "sonner";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Split Expenses",
  description: "The Smart Way to Split Bills",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Split Expenses",
    description: "The Smart Way to Split Bills",
    images: [
      {
        url: "/screen.png",
        width: 1200,
        height: 630,
        alt: "Split Expenses Preview",
      },
    ],
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${inter.variable}`}
    >
      <head />
      <body className="bg-background min-h-screen font-sans antialiased">
        <TRPCReactProvider>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Providers>
        </TRPCReactProvider>
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
              description: "group-[.toast]:text-muted-foreground",
              actionButton:
                "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
              cancelButton:
                "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
