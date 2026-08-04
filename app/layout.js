import './globals.css';
import './logo-fix.css';

export const metadata = {
  title: 'APS ESG One',
  description: 'Environmental, Social and Governance data platform for Amagasaki Pipe (Thailand)'
};

const brandingScript = `
(() => {
  const replacements = [
    ['APS ESG PLATFORM', 'APS ESG ONE'],
    ['APS ESG Platform', 'APS ESG One'],
    ['APS ESG', 'APS ESG One'],
    ['Enterprise · v0.7', 'ESG One · v0.8']
  ];

  const update = (root = document.body) => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let value = node.nodeValue;
      replacements.forEach(([from, to]) => {
        if (value && value.includes(from) && !value.includes('APS ESG One One')) {
          value = value.replaceAll(from, to);
        }
      });
      value = value?.replaceAll('APS ESG One One', 'APS ESG One');
      if (value !== node.nodeValue) node.nodeValue = value;
    });
    document.title = 'APS ESG One';
  };

  const run = () => update(document.body);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: brandingScript }} />
      </body>
    </html>
  );
}
