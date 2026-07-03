import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Trigger config reload to pre-bundle new dependencies like jspdf and xlsx
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})