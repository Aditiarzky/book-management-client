declare global {
  interface Window {
    disqus_shortname?: string;
    DISQUS?: {
      reset: (config: { reload?: boolean }) => void;
    };
  }
}