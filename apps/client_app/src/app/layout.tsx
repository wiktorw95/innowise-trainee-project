import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Innogram',
  description: 'Share your moments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
