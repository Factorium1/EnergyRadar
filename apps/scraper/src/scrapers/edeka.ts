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

async function getBasicData() {
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

    console.log(`[Info] Found ${data.length} elements`);
    return data;
  }
}

type DataWithNutrition = ScrapedData & {
  kcal: number | null;
  sugar: number | null;
  kohlenhydrate: number | null;
  coffein: number | null;
  taurin: number | null;
};

async function getDetailsPage(url: string) {
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

function parseNutrientValue(text: string): number | null {
  // "180 kJ / 43 kcal" -> 43, "10,5 g" -> 10.5, "32 mg" -> 32
  const match = text.match(/([\d,]+)\s*(?:kcal|g|mg)?\s*$/);
  return match?.[1] ? Number(match[1].replace(",", ".")) : null;
}

function extractPer100ml(text: string, nutrientName: string): number | null {
  // Sucht z.B. "Koffein" gefolgt (irgendwo in der Nähe) von einer Zahl + "mg" + "/100" o.ae.
  const regex = new RegExp(
    `${nutrientName}[^\\d]*?([\\d,]+)\\s*mg\\s*/\\s*100\\s*ml`,
    "i", // case-insensitive
  );
  const match = text.match(regex);
  return match?.[1] ? Number(match[1].replace(",", ".")) : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractNutrients($: cheerio.CheerioAPI): {
  kcal: number | null;
  sugar: number | null;
  kohlenhydrate: number | null;
  coffein: number | null;
  taurin: number | null;
} {
  const nutrients: Record<string, string> = {};

  $(".nutrient-table tr").each((i, el) => {
    const label = $(el).find("th").text().trim().toLowerCase();
    const value = $(el).find("td").text().trim();
    nutrients[label] = value;
  });

  const fullText = $(".article-long-description").text();
  const coffein = extractPer100ml(fullText, "Koffein");
  const taurin = extractPer100ml(fullText, "Taurin");

  return {
    kcal: nutrients["brennwert in kcal"]
      ? parseNutrientValue(nutrients["brennwert in kcal"])
      : null,
    sugar: nutrients["davon zucker in g"]
      ? parseNutrientValue(nutrients["davon zucker in g"])
      : null,
    kohlenhydrate: nutrients["kohlenhydrate in g"]
      ? parseNutrientValue(nutrients["kohlenhydrate in g"])
      : null,
    coffein: coffein ?? null,
    taurin: taurin ?? null,
  };
}

async function getNutrition() {
  const basicData = await getBasicData();
  if (!basicData) return;

  const data: DataWithNutrition[] = [];

  for (const item of basicData) {
    console.log(
      `[Info] Send request ${data.length + 1} of ${basicData.length}`,
    );

    const html = await getDetailsPage(item.url);
    const $ = cheerio.load(html);

    const nutrients = extractNutrients($);

    data.push({
      ...item,
      ...nutrients,
    });

    await delay(1000 + Math.random() * 1000);
  }

  return data;
}

const brands = [
  "Red Bull",
  "Monster",
  "Effect",
  "Gönrgy",
  "Rockstar",
  "Celsius",
  "Reign",
];

export async function getEdekaData() {
  console.log("[Info] Start scraping Edeka");
  const plain = await getNutrition();
  console.log(`[Info] Got ${plain?.length} products from Edeka`);
  const filtered = plain?.filter((el) =>
    brands.some((brand) =>
      el.title
        .toLowerCase()
        .replace(/\s+/g, "")
        .includes(brand.toLowerCase().replace(/\s+/g, "")),
    ),
  );
  console.log(`[Info] Got ${filtered?.length} final products from Edeka`);
  return filtered;
}

await getEdekaData();
