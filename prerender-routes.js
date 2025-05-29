// prerender-routes.js (CommonJS)
const useBookStore = require('./src/store/useBookStore').default;
const useChapterStore = require('./src/store/useChapterStore').default;

async function getPrerenderRoutes() {
  try {
    await useBookStore.getState().fetchBooks(1, 100);
    const books = useBookStore.getState().books;
    const routes = ['/', '/search'];

    for (const book of books) {
      routes.push(`/detail/${book.id}`);
      try {
        await useChapterStore.getState().fetchByBook(book.id);
        const chapters = useChapterStore.getState().chapterByBook;
        routes.push(...chapters.map((ch) => `/view/${book.id}/${ch.id}`));
      } catch (error) {
        console.error(`Failed to fetch chapters for book ${book.id}:`, error);
      }
    }
    return routes;
  } catch (error) {
    console.error('Failed to fetch books:', error);
    return ['/', '/search'];
  }
}

module.exports = getPrerenderRoutes;
