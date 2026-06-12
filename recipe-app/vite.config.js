import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy injected into the built index.html ONLY.
// It is deliberately not applied to the dev server, whose HMR relies on
// inline scripts, eval, and a websocket connection that a strict CSP blocks.
// Locking style-src/font-src to the Google Fonts origins also mitigates the
// CDN-hijack risk on the <link> stylesheet (a more robust defence than a
// pinned SRI hash, which the css2 endpoint breaks over time).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function cspPlugin() {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</title>',
        `</title>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
