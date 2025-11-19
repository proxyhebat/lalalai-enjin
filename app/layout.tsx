import type { Metadata } from "next";

import { architectsDaughter, firacode, georgia } from "@/lib/fonts";

import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "LaLaLai",
  description:
    "Turn a long YouTube video into many engaging short videos in just one click."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${architectsDaughter.variable} ${firacode.variable} ${georgia.variable} antialiased`}
      >
        <ConvexClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
