import { Provider } from "jotai";
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";

import "./globals.css";

const GENERAL_SANS_HREF =
  "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&f[]=inter@400,500,600&display=swap";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flux — visual workflow automation",
  description:
    "Build automations by connecting triggers, AI models, and actions on a visual canvas. Open-source, self-hostable, type-safe end to end.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="stylesheet" href={GENERAL_SANS_HREF} />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <NuqsAdapter>
              <Provider>
                {children}
                <Toaster />
              </Provider>
            </NuqsAdapter>
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}