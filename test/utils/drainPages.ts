export async function drainAllPages<T extends { id: string }>(
  fetch: (
    cursor?: string,
  ) => Promise<{ items: T[]; cursor?: string; hasNextPage: boolean }>,
) {
  const seen = new Set<string>();
  const all: T[] = [];
  let cursor: string | undefined;
  do {
    const page = await fetch(cursor);
    for (const it of page.items) {
      if (seen.has(it.id)) {
        throw new Error(`Duplicado id=${it.id}`);
      }
      seen.add(it.id);
      all.push(it);
    }
    cursor = page.cursor;
  } while (cursor);
  return all;
}
