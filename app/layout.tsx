/* eslint-disable @next/next/no-page-custom-font */
import "./styles/globals.scss";
import "./styles/markdown.scss";
import "./styles/highlight.scss";
import { getClientConfig } from "./config/client";
import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import { getServerSideConfig } from "./config/server";

export const metadata: Metadata = {
  title: {
    default: "ModelPanda - All the World's Best AI. One Simple Subscription.",
    template: "%s | ModelPanda",
  },
  description:
    "Access GPT-4o, DeepSeek, Gemini, and more top AI models through a single interface. One subscription, 6 AI models, $12/month. Free tier available.",
  keywords: [
    "AI chat",
    "GPT-4o",
    "DeepSeek",
    "Gemini",
    "AI models",
    "ChatGPT alternative",
    "multiple AI models",
    "AI assistant",
    "ModelPanda",
  ],
  authors: [{ name: "ModelPanda" }],
  creator: "ModelPanda",
  publisher: "ModelPanda",
  metadataBase: new URL("https://modelpanda.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://modelpanda.ai",
    siteName: "ModelPanda",
    title: "ModelPanda - All the World's Best AI. One Simple Subscription.",
    description:
      "Access GPT-4o, DeepSeek, Gemini, and more top AI models through a single interface. One subscription, 6 AI models, $12/month.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ModelPanda - Access all top AI models in one place",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ModelPanda - All the World's Best AI. One Simple Subscription.",
    description:
      "Access GPT-4o, DeepSeek, Gemini, and more top AI models through a single interface. $12/month for unlimited access.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    title: "ModelPanda",
    statusBarStyle: "default",
    capable: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverConfig = getServerSideConfig();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ModelPanda",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Access GPT-4o, DeepSeek, Gemini, and more top AI models through a single, beautifully designed interface.",
    url: "https://modelpanda.ai",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "20 messages per day, access to all 6 AI models",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "12",
        priceCurrency: "USD",
        description:
          "Unlimited messages, all 6 AI models, priority response speed",
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <meta name="config" content={JSON.stringify(getClientConfig())} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link
          rel="manifest"
          href="/site.webmanifest"
          crossOrigin="use-credentials"
        ></link>
        <link rel="canonical" href="https://modelpanda.ai" />
        <script src="/serviceWorkerRegister.js" defer></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        {serverConfig?.isVercel && (
          <>
            <SpeedInsights />
          </>
        )}
        {serverConfig?.gtmId && (
          <>
            <GoogleTagManager gtmId={serverConfig.gtmId} />
          </>
        )}
        {serverConfig?.gaId && (
          <>
            <GoogleAnalytics gaId={serverConfig.gaId} />
          </>
        )}
      </body>
    </html>
  );
}
