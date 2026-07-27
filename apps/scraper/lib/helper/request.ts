export async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "de-DE,de;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  return html;
}

/** Alias fuer Detailseiten - gleicher Request wie fetchHtml. */
export const getDetailsPage = fetchHtml;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function politeDelay(): Promise<void> {
  return delay(1000 + Math.random() * 1000);
}
