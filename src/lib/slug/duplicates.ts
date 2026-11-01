export type DuplicateAssignment = {
  slug: string;
  duplicate: boolean;
  lengthWarning: boolean;
};

function codePointLength(value: string): number {
  return [...value].length;
}

export function assignDuplicates(
  slugs: string[],
  separator: string,
  maxLength: number | null,
  locked: boolean[] = [],
): DuplicateAssignment[] {
  const firstIndex = new Map<string, number>();
  slugs.forEach((slug, index) => {
    if (slug && !firstIndex.has(slug)) firstIndex.set(slug, index);
  });

  const used = new Set<string>();
  return slugs.map((slug, index) => {
    if (!slug) return { slug: "", duplicate: false, lengthWarning: false };

    const reservedElsewhere = (candidate: string) => {
      const owner = firstIndex.get(candidate);
      return owner !== undefined && owner !== index;
    };

    if (firstIndex.get(slug) === index && !used.has(slug)) {
      used.add(slug);
      return { slug, duplicate: false, lengthWarning: false };
    }

    if (locked[index]) {
      return { slug, duplicate: true, lengthWarning: false };
    }

    let n = 2;
    let candidate = `${slug}${separator}${n}`;
    while (used.has(candidate) || reservedElsewhere(candidate)) {
      n += 1;
      candidate = `${slug}${separator}${n}`;
    }
    used.add(candidate);
    const lengthWarning = maxLength !== null && codePointLength(candidate) > maxLength;
    return { slug: candidate, duplicate: true, lengthWarning };
  });
}
