import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import QueryProvider from "@/components/providers/QueryProvider";
import { Header } from "@/components/layout/Header";
import { WorkspaceWrapper } from "@/components/layout/WorkspaceWrapper";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrewOps | Enterprise Coffee Platform",
  description: "A premium cafe storefront and kitchen management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} font-sans h-full antialiased`}
    >
      {/* Background is dark coffee */}
      <body className="h-full bg-[#3E2F23] flex justify-center items-center p-2 lg:p-4 overflow-hidden">
        <QueryProvider>
          
          {/* The App Frame (Simulates a desktop window) */}
          <div className="relative w-full h-full max-w-[1440px] max-h-[900px] bg-[#F2EFE9] rounded-2xl md:rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border-4 md:border-8 border-coffee">
            
            <Header />

            {/* Workspace Area */}
            <WorkspaceWrapper>
              {children}
            </WorkspaceWrapper>

          </div>

        </QueryProvider>
      </body>
    </html>
  );
}
