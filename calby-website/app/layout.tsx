import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#070A11',
};

export const metadata: Metadata = {
  title: 'Calby',
  description: 'Talk to Calby. Remember what matters, stay on schedule, and get things done.',
  icons: {
    icon: [
      { url: '/brand/calby-favicon.png', type: 'image/png' },
    ],
    shortcut: '/brand/calby-favicon.png',
    apple: '/brand/calby-favicon.png',
  },
  openGraph: {
    title: 'Calby',
    description: 'Talk to Calby. Remember what matters, stay on schedule, and get things done.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calby',
    description: 'Talk to Calby. Remember what matters, stay on schedule, and get things done.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} font-sans scroll-smooth`}>
      <body className="bg-[#070A11] text-[#F8FAFC] min-h-screen selection:bg-[#38BDF8] selection:text-[#070A11] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
