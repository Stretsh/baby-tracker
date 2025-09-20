import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  
  // Development server configuration
  devServer: {
    port: 3300,
  },
  
  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    dbPassword: process.env.DB_PASSWORD,
    
    // Public keys (exposed to client-side)
    public: {
      apiBase: '/api',
      dbHost: process.env.DB_HOST,
      dbPort: process.env.DB_PORT,
      dbName: process.env.DB_NAME,
      dbUser: process.env.DB_USER,
    }
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})