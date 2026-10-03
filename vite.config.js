import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Fills __SITE_URL__ in index.html (canonical / og:url / og:image need
// absolute URLs). When VITE_SITE_URL is unset those lines are dropped.
function siteUrlHtml(siteUrl) {
  return {
    name: 'agsb-site-url-html',
    transformIndexHtml(html) {
      if (siteUrl) return html.replaceAll('__SITE_URL__', siteUrl)
      return html.split('\n').filter((line) => !line.includes('__SITE_URL__')).join('\n')
    },
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  if (command === 'build' && !env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not set. Add it to .env.production (see .env.example).')
  }
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '')
  if (command === 'build' && !siteUrl) {
    console.warn('[agsb] VITE_SITE_URL is not set: canonical/Open Graph URLs and the sitemap will be skipped.')
  }

  return {
    plugins: [siteUrlHtml(siteUrl), tailwindcss(), react()],
  }
})
