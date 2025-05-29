// generate-sitemap.ts (pakai tsx atau ts-node)
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import useBookStore from './src/store/useBookStore.ts';
import useChapterStore from './src/store/useChapterStore.ts';

// __dirname support di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/search'];

  await useBookStore.getState().fetchBooks(1, 100);
  const books = useBookStore.getState().books;

  for (const book of books) {
    routes.push(`/detail/${book.id}`);
    await useChapterStore.getState().fetchByBook(book.id);
    const chapters = useChapterStore.getState().chapterByBook;
    routes.push(...chapters.map(ch => `/view/${book.id}/${ch.id}`));
  }

  return routes;
}

async function generateSitemap() {
  const hostname = 'https://riztranslation.rf.gd';
  const routes = await getRoutes();

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map(route => `
  <url>
    <loc>${hostname}${route}</loc>
  </url>`).join('\n') +
    `\n</urlset>`;

  const outputPath = path.join(__dirname, 'dist', 'sitemap.xml');
  await fs.writeFile(outputPath, sitemapXml);
  console.log('✅ Sitemap generated at dist/sitemap.xml');
}

generateSitemap().catch(console.error);
