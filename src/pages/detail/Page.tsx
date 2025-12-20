import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import useBookStore from "../../store/useBookStore";
import DetailComponent from "./Component";
import GuestLayout from "../layouts/GuestLayout";
import Sekeleton from "@/components/Sekeleton";
import { setMetaTags } from "@/utils/meta";

export default function Detail() {
  const { fetchBookById, loading: loadingBook, detailBook } = useBookStore();
  const { id } = useParams({ strict: false });
  const idToNumber = id || '';
  const parseId = parseInt(idToNumber, 10);

  useEffect(() => {
    fetchBookById(parseId);
  }, [fetchBookById, parseId]);

  useEffect(()=>{
    if(detailBook && !loadingBook){
      setMetaTags({
      title: `Baca ${detailBook.judul} terbaru | Riztranslation`,
      description: detailBook.synopsis || `Baca ${detailBook.judul} terbaru di website Riztranslation`,
      image: detailBook.cover || 'https://i.imgur.com/uaZ4pwN.jpeg',
      url: window.location.href,
    })
    }
  })

  return (
    <GuestLayout>
      {loadingBook ? (
        <div className="mt-5 mb-16">
          <Sekeleton height="198px">
            <div className="w-full drop-shadow-2xl flex justify-center pt-16">
              <Sekeleton width="180px" className="brightness-90" height="208px"></Sekeleton>
            </div>
          </Sekeleton>
          <div className="pt-24 w-full flex flex-col gap-2 items-center justify-center">
            <Sekeleton width="146px" height="20px"/>
            <Sekeleton width="146px" height="15px" className="opacity-80"/>
          </div>
        </div>
      ) : ( 
        <DetailComponent book={detailBook} /> 
      )}
    </GuestLayout>
  );
}
