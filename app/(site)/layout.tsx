import "../styles/globals.css";
import Script from "next/script";
import AmplitudeInitializer from "../components/AmplitudeInitializer";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const GOOGLE_ANALYTICS_ID = "G-B94X4749PN";
const ADSENSE_CLIENT_ID = "ca-pub-9184203217182921";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-base-100 text-base-content">
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
        <AmplitudeInitializer />
        <Navbar />
        <main className="container mx-auto px-4 lg:px-8 py-8 min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
