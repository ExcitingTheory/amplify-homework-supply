import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Homework Supply',
  description: 'eLearning platform for instructors and learners',
  manifest: '/manifest.json',
  icons: {
    icon: '/static/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#556cd6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
