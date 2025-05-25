import { useEffect } from "react";
import useChapterStore from "../../store/useChapterStore";
import useBookStore from "../../store/useBookStore";
import HomeComponent from "./Component";
import GuestLayout from "../layouts/GuestLayout";

export default function Home() {
  const { fetchBooks } = useBookStore();
  const { fetchChapters } = useChapterStore();

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchBooks(), fetchChapters()]);
    };

    loadInitialData();
  }, [fetchBooks, fetchChapters]);

  return (
    <GuestLayout>
      <HomeComponent />
    </GuestLayout>
  );
}