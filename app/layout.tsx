
import './globals.css';

export const metadata = {
  title: 'LOVE6 — Watch. Explore. Feel More.',
  description: 'LOVE6 video streaming platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        {children}
      </body>
    </html>
  );
}
