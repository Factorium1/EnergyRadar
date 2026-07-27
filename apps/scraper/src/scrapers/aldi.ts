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
import { parseGermanNumber } from "../../lib/helper/parse.js";
import { fetchHtml, politeDelay } from "../../lib/helper/request.js";
import { filterByBrand } from "../../lib/brands.js";

const baseUrl = "https://www.aldi-sued.de";

function getSearchPage() {
  return fetchHtml(`${baseUrl}/suchergebnisse?q=energy+drink`);
}

async function getBasicData(): Promise<ScraperProduct[]> {
  const html = await getSearchPage();
  const data: ScraperProduct[] = [];
  const $ = cheerio.load(html);

  $("div.product-tile[data-test='product-tile']").each((_i, el) => {
    const $el = $(el);
    const name = $el.find("[data-test='product-tile__name'] p").text().trim();
    const brandName = $el
      .find("[data-test='product-tile__brandname'] p")
      .text()
      .trim();
    const title = brandName ? `${brandName} ${name}` : name;

    const href = $el.find("a.product-tile__link").attr("href") ?? "";
    const url = href.startsWith("http") ? href : `${baseUrl}${href}`;

    const priceRaw = $el.find(".base-price__regular > span").first().text();
    const price = parseGermanNumber(priceRaw);
    if (!title || price === null) return;

    const pricePerLiterRaw = $el
      .find("[data-test='product-tile__comparison-price'] p")
      .text();
    const pricePerLiter = parseGermanNumber(pricePerLiterRaw);

    const sizeRaw = $el
      .find("[data-test='product-tile__unit-of-measurement'] p")
      .text();
    const sizeLiters = parseGermanNumber(sizeRaw);
    const canSizeMl = sizeLiters !== null ? sizeLiters * 1000 : null;

    data.push({
      seller: 'aldi',
      title,
      url,
      price,
      pricePerLiter,
      canSizeMl,
    });
  });

  console.log(`[Info] Found ${data.length} elements`);
  return data;
}

type Nutrition = Omit<ScraperProductWithNutrition, keyof ScraperProduct>;

function extractNutrients($: cheerio.CheerioAPI): Nutrition {
  // Aldi renders the nutrition facts as two td columns: label | value (per 100 ml)
  const nutrients = collectNutrientRows($, "table.table tbody tr", "td", "td");

  const fullText = $(".product-details").text();

  return {
    kcal: nutrientNumber(nutrients, "energie [kcal]"),
    sugar: nutrientNumber(nutrients, "kohlenhydrate, davon zucker"),
    kohlenhydrate: nutrientNumber(nutrients, "kohlenhydrate"),
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

export async function getAldiData() {
  console.log("[Info] Start scraping Aldi");
  const plain = await getNutrition();
  console.log(`[Info] Got ${plain.length} products from Aldi`);
  const filtered = filterByBrand(plain);
  console.log(`[Info] Got ${filtered.length} final products from Aldi`);
  return filtered;
}
