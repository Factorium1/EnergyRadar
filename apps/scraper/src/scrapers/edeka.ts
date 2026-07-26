import * as cheerio from "cheerio";

async function getEdekaPlainData(pgNr: number) {
  const baseUrl = "https://www.edeka24.de/Lebensmittel/Getraenke/Energydrinks/";
  const url = pgNr === 0 ? baseUrl : `${baseUrl}?pgNr=${pgNr}`;
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

type ScrapedData = {
  title: string;
  url: string;
  price: number;
  pricePerLiter: number | null;
  canSizeMl: number | null;
};

function parseGermanPrice(text: string): number {
  return Number(text.replace("€", "").replace(",", ".").trim());
}

async function getData() {
  const data: ScrapedData[] = [];
  for (let pgNr = 0; pgNr < 2; pgNr++) {
    const html = await getEdekaPlainData(pgNr);
    const $ = cheerio.load(html);

    $("div.product-details").each((i, el) => {
      const $el = $(el);
      const title = $el.find("a.title > h2").text().trim();

      const url = $el.find("a.title").attr("href") ?? "";

      const priceText = $el.find(".price").text().trim();
      const price = parseGermanPrice(priceText);

      const priceNoteText = $el.find(".price-note").first().text();
      const priceMatch = priceNoteText.match(/([\d,]+)\s*€\/l/);
      const pricePerLiter = priceMatch
        ? parseGermanPrice(priceMatch[1] + " €")
        : null;

      const canSizeMl = pricePerLiter
        ? parseGermanPrice((price / pricePerLiter).toFixed(2)) * 1000
        : null;

      data.push({
        title,
        price,
        pricePerLiter,
        canSizeMl,
        url,
      });
    });

    return data;
  }
}
