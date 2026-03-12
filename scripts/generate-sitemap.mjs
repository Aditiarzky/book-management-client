import { writeFileSync } from 'fs';
import axios from 'axios';

const BASE_URL = 'https://riztranslation.pages.dev';// ganti domain kamu
const API_URL = 'https://book-management-express.vercel.app'; // ganti API kamu

async function generateSitemap() {
  // Fetch semua buku dan chapter dari API kamu
  const [booksRes, chaptersRes] = await Promise.all([
    axios.get(`${API_URL}/api/books?limit=9999`),
    axios.get(`${API_URL}/api/chapters?limit=9999`),
  ]);

  const books = booksRes.data.data || booksRes.data;
  const chapters = chaptersRes.data.data || chaptersRes.data;

  // Route statis
  const staticRoutes = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/search', changefreq: 'weekly', priority: '0.7' },
  ];

  // Route dinamis: halaman detail buku
  const bookRoutes = books.map(book => ({
    loc: `/detail/${book.id}`,
    lastmod: book.updated_at || book.created_at,
    changefreq: 'weekly',
    priority: '0.8',
  }));

  // Route dinamis: halaman baca chapter
  const chapterRoutes = chapters.map(ch => ({
    loc: `/view/${ch.bookId}/${ch.id}`,
    lastmod: ch.updated_at || ch.created_at,
    changefreq: 'monthly',
    priority: '0.6',
  }));

  const allRoutes = [...staticRoutes, ...bookRoutes, ...chapterRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(r => `  <url>
    <loc>${BASE_URL}${r.loc}</loc>
    ${r.lastmod ? `<lastmod>${new Date(r.lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFileSync('public/sitemap.xml', xml, 'utf8');
  console.log(`✅ Sitemap generated: ${allRoutes.length} URLs`);
}

generateSitemap().catch(err => {
  console.error('❌ Gagal generate sitemap:', err.message);
  process.exit(1);
});
