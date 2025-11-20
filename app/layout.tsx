import type { Metadata } from "next";

import { architectsDaughter, firacode, georgia } from "@/lib/fonts";

import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
            {/* Development Banner */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 px-4 text-sm font-medium">
              🚧 This project is still in early development 🚧
            </header>
            {children}
            <footer className="flex justify-center items-center h-16 border-t">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} LaLaLai OSS. All rights
                reserved.
              </p>
            </footer>
            <Toaster />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
