import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', 
    port: 5173, 
    allowedHosts: ['8f0f-66-96-225-146.ngrok-free.app']
  },
  optimizeDeps: {
    include: ['disqus-react'],
    exclude: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-image']
  }
})
