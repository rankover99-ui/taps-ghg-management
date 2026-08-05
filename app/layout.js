import './globals.css';
import './logo-fix.css';

export const metadata = {
  title: 'APS ESG One',
  description: 'Environmental, Social and Governance data platform for Amagasaki Pipe (Thailand)'
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
