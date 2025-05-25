import { useEffect } from "react";

export const RemoveParams = () => {
  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.has('i')) {
      url.searchParams.delete('i');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  return null;
};