import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cykelfesten',
  description: 'Anmäl dig till cykelfest – en progressiv middag på cykel!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
