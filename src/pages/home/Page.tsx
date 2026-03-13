import { useEffect } from "react";
import HomeComponent from "./Component";
import GuestLayout from "../layouts/GuestLayout";
import { setMetaTags } from "@/utils/meta";

export default function Home() {

  useEffect(() => {
    setMetaTags({
      title: `Home | Riztranslation - Fantranslator Komik Indonesia`,
      description: "Baca komik Indonesia gratis di Riztranslation! Fantranslator untuk komik, manga, light novel, dan web manga. Temukan karya seperti Bokura wa 'Yomi' wo Machigaeru, boku no ikezuna konyakusha dan lainnya...",
      image: 'https://i.imgur.com/uaZ4pwN.jpeg',
      url: window.location.href,
    })
  }, [])

  return (
    <GuestLayout>
      <HomeComponent />
    </GuestLayout>
  );
}
