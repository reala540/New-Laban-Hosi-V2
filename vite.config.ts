import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The hidden admin panel lives at /manage/<ADMIN_URL_KEY>. The key is read
// from the ADMIN_URL_KEY environment variable at build time and baked into
// the bundle. If it's not set, the admin panel is unreachable (any /manage/*
// URL shows the generic not-found page).
const adminPath = process.env.ADMIN_URL_KEY ? `/manage/${process.env.ADMIN_URL_KEY}` : ''

export default defineConfig({
  plugins: [react()],
  define: {
    __ADMIN_PATH__: JSON.stringify(adminPath)
  }
})
