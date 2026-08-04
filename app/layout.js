import './globals.css';

export const metadata = {
  title: 'APS ESG Platform',
  description: 'GHG and ESG data management for Amagasaki Pipe (Thailand)'
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
