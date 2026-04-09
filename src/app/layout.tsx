
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'KST HUB',
    template: '%s | KST HUB',
  },
  description: '미래를 여는 스마트 교육 플랫폼, KST HUB',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%234b88dc%22/><path d=%22M25 35h25a5 5 0 0 1 5 5v35a5 5 0 0 0-5-5H25zM75 35H50a5 5 0 0 0-5 5v35a5 5 0 0 1 5-5h25z%22 fill=%22none%22 stroke=%22white%22 stroke-width=%228%22/></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <FirebaseClientProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <Toaster />
        </FirebaseClientProvider>
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
