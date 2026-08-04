import './globals.css';

export const metadata = {
  title: 'TAPS ESG Platform',
  description: 'GHG and ESG data management for TAPS'
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
