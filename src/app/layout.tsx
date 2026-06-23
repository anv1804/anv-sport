import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.scss";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: 'swap',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ANV Sport | Tốc độ & Chuẩn xác",
  description: "Nền tảng dữ liệu thể thao đa môn: Bóng đá, MMA, Billiards với giao diện cực chất.",
  icons: {
    icon: "/icons/anv-sport-icon.png",
    shortcut: "/icons/anv-sport-icon.png",
    apple: "/icons/anv-sport-icon.png",
  }
};

import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <NextTopLoader
          color="#10b981"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #10b981,0 0 5px #10b981"
        />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister().then(function(success) {
                        if (success) console.log('Unregistered active service worker for local development.');
                      });
                    }
                  });
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(reg) {
                      console.log('SW registered with scope: ', reg.scope);
                    }).catch(function(err) {
                      console.log('SW registration failed: ', err);
                    });
                  });
                }
              }
            `
          }}
        />
      </body>
    </html>
  );
}
