import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fontDisplay = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "BuildLink — Infrastructure & Trade Network",
  description: "Hire trusted trade professionals and order from verified local supply shops",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        {/* Set the theme before first paint to avoid a light flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("lh-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
