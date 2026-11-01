import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://onlinesluggenerator.com",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
    inlineStylesheets: "never",
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "de", "fr", "pt"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
