import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/sitemap', '@nuxtjs/robots', '@nuxt/icon'],

  css: ['~/assets/css/main.css'],

  vite: { plugins: [tailwindcss()] },

  app: {
    head: {
      htmlAttrs: { lang: 'en-GB' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500&display=swap' },
      ],
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: process.env.NUXT_PUBLIC_SITE_NAME || 'Industry Rankings',
  },

  sitemap: { sources: ['/api/__sitemap__/urls'], exclude: ['/'] },

  runtimeConfig: {
    llmProvider: 'gemini', // 'gemini' | 'ollama' | 'none'
    geminiApiKey: '',
    geminiModel: 'gemini-3.5-flash',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.1',
    public: {
      siteUrl: 'http://localhost:3000',
      siteName: 'Industry Rankings',
    },
  },

  nitro: {
    storage: {
      blogs: { driver: 'fs', base: './data/blogs' },
    },
  },
})
