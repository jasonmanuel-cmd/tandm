import services from '../data/services.json';
import hoods from '../data/neighborhoods.json';

const BASE = 'https://tandmbak.com';
const core = [
  ['/', '1.0', 'weekly'],
  ['/services.html', '0.9', 'monthly'],
  ['/service-areas.html', '0.8', 'monthly'],
  ['/about.html', '0.7', 'monthly'],
  ['/contact.html', '0.9', 'monthly'],
  ['/reviews.html', '0.7', 'weekly'],
  ['/faq.html', '0.7', 'monthly'],
  ['/gallery/index.html', '0.6', 'monthly'],
];

export function GET() {
  const urls = [
    ...core,
    ...services.map((s) => [`/services/${s.slug}.html`, '0.8', 'monthly']),
    ...hoods.map((h) => [`/neighborhoods/${h.slug}.html`, '0.7', 'monthly']),
  ];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(([p, pr, cf]) => `  <url><loc>${BASE}${p}</loc><priority>${pr}</priority><changefreq>${cf}</changefreq></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
