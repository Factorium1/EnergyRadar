import * as cheerio from "cheerio";
import {
  ScraperProduct,
  ScraperProductWithNutrition,
} from "../../types/product.js";
import {
  collectNutrientRows,
  extractPer100ml,
  nutrientNumber,
} from "../../lib/helper/nutrition.js";
import {
  canSizeFromPrices,
  parseGermanNumber,
  parseGermanPrice,
} from "../../lib/helper/parse.js";
import { fetchHtml, politeDelay } from "../../lib/helper/request.js";
import { filterByBrand } from "../../lib/brands.js";

const baseUrl = "https://www.edeka24.de/Lebensmittel/Getraenke/Energydrinks/";

function getListPage(pgNr: number) {
  const url = pgNr === 0 ? baseUrl : `${baseUrl}?pgNr=${pgNr}`;
  return fetchHtml(url);
}

async function getBasicData() {
  const data: ScraperProduct[] = [];

  for (let pgNr = 0; pgNr < 2; pgNr++) {
    const html = await getListPage(pgNr);
    const $ = cheerio.load(html);

    $("div.product-details").each((_i, el) => {
      const $el = $(el);
      const title = $el.find("a.title > h2").text().trim();

      const url = $el.find("a.title").attr("href") ?? "";

      const price = parseGermanPrice($el.find(".price").text().trim());

      const priceNoteText = $el.find(".price-note").first().text();
      const priceMatch = priceNoteText.match(/([\d,]+)\s*€\/l/);
      const pricePerLiter = priceMatch?.[1]
        ? parseGermanNumber(priceMatch[1])
        : null;

      data.push({
        title,
        price,
        pricePerLiter,
        canSizeMl: canSizeFromPrices(price, pricePerLiter),
        url,
      });
    });
  }

  console.log(`[Info] Found ${data.length} elements`);
  return data;
}

type Nutrition = Omit<ScraperProductWithNutrition, keyof ScraperProduct>;

function extractNutrients($: cheerio.CheerioAPI): Nutrition {
  const nutrients = collectNutrientRows($, ".nutrient-table tr", "th", "td");

  const fullText = $(".article-long-description").text();

  return {
    kcal: nutrientNumber(nutrients, "brennwert in kcal"),
    sugar: nutrientNumber(nutrients, "davon zucker in g"),
    kohlenhydrate: nutrientNumber(nutrients, "kohlenhydrate in g"),
    coffein: extractPer100ml(fullText, "Koffein"),
    taurin: extractPer100ml(fullText, "Taurin"),
  };
}

async function getNutrition() {
  const basicData = await getBasicData();
  const data: ScraperProductWithNutrition[] = [];

  for (const item of basicData) {
    console.log(`[Info] Send request ${data.length + 1} of ${basicData.length}`);

    const html = await fetchHtml(item.url);
    const $ = cheerio.load(html);

    data.push({
      ...item,
      ...extractNutrients($),
    });

    await politeDelay();
  }

  return data;
}

export async function getEdekaData() {
  console.log("[Info] Start scraping Edeka");
  const plain = await getNutrition();
  console.log(`[Info] Got ${plain.length} products from Edeka`);
  const filtered = filterByBrand(plain);
  console.log(`[Info] Got ${filtered.length} final products from Edeka`);
  return filtered;
}
