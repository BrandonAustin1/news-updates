export const metadata = {
  title: 'News Updates',
  description: 'Live macroeconomic calendar feed for iOS Calendar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}