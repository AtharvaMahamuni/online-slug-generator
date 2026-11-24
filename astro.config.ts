import { defineConfig } from "astro/config";
const NPM_SLUGIFY_LICENSE_BANNER = `/*!
 * parity-npm-charmap.json is the character map from npm slugify 1.6.9,
 * copied as a static rule table. It is not imported as a runtime dependency.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) Simeon Velichkov <simeonvelichkov@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Source: https://github.com/simov/slugify
 */
`;

function npmSlugifyLicenseBanner() {
  return {
    name: "npm-slugify-license-banner",
    generateBundle(_options: unknown, bundle: Record<string, any>) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.code) continue;
        const carriesCharmap = chunk.fileName.includes("tool") || chunk.code.includes("Copyright (c) Simeon Velichkov");
        if (!carriesCharmap) continue;
        if (chunk.code.includes("/*!") && chunk.code.includes("Copyright (c) Simeon Velichkov")) continue;
        chunk.code = `${NPM_SLUGIFY_LICENSE_BANNER}${chunk.code}`;
      }
    },
  };
}

export default defineConfig({
  site: "https://onlinesluggenerator.com",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
    inlineStylesheets: "never",
  },
  vite: {
    plugins: [npmSlugifyLicenseBanner()],
    esbuild: {
      legalComments: "inline",
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "de", "fr", "pt"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
