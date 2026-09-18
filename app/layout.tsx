import './globals.css';

export const metadata = {
  title: 'News Updates Dispatcher',
  description: 'Live macroeconomic calendar feed for iOS Calendar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090C] text-zinc-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}