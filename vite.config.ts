import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // ADD THIS LINE: Replace 'your-repo-name' with your actual GitHub repository name
  base: '/juktiverse/', 
  plugins: [
    react(),
    tailwindcss(),
  ],
})