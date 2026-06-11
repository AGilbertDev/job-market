// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxt/fonts', '@nuxtjs/i18n', '@nuxt/eslint'],

  i18n: {
    defaultLocale: 'fr',
    locales: [
      { code: 'fr', name: 'Français (Québec)', file: 'fr.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ]
  },

  runtimeConfig: {
    tursoUrl: '',
    tursoAuthToken: '',
    resendApiKey: '',
    adzunaAppId: '',
    adzunaAppKey: '',
    public: {}
  }
})
