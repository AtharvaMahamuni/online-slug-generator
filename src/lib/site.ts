export const SITE = "https://onlinesluggenerator.com";
export const SITE_NAME = "Online Slug Generator";
export const REPO = "https://github.com/AtharvaMahamuni/online-slug-generator";
export const ISSUES = `${REPO}/issues`;
export const PUBLISHED = "2026-11-01";
export const PUBLISHED_LABEL = "1 November 2026";

/** A person, not a company. No street address is published. */
export const AUTHOR = {
  name: "Atharva",
  xHandle: "@athmatwt",
  x: "https://x.com/athmatwt",
  linkedin: "https://www.linkedin.com/in/atharvamahamuni",
  github: "https://github.com/AtharvaMahamuni",
} as const;

export const ORG_ID = `${SITE}/#org`;
export const PERSON_ID = `${SITE}/#atharva`;

export function canonical(path: string): string {
  if (path === "/" || path === "") return `${SITE}/`;
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Organization and Person. Shared by every page and by /identity.json. */
export function identityGraph(): {
  "@context": string;
  "@graph": Record<string, unknown>[];
} {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: SITE_NAME,
        url: `${SITE}/`,
        logo: `${SITE}/favicon.svg`,
        founder: { "@id": PERSON_ID },
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: AUTHOR.name,
        url: `${SITE}/about`,
        sameAs: [AUTHOR.x, AUTHOR.linkedin, AUTHOR.github],
      },
    ],
  };
}
