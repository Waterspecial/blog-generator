// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/sitemap'],

  app: {
    head: {
      htmlAttrs: { lang: 'en-GB' },
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: process.env.NUXT_PUBLIC_SITE_NAME || 'Industry Rankings',
  },

  runtimeConfig: {
    llmProvider: 'gemini', // 'gemini' | 'ollama' | 'none'
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
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
