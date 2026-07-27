export type ScraperProduct = {
  title: string;
  url: string;
  price: number;
  pricePerLiter: number | null;
  canSizeMl: number | null;
};

export type ScraperProductWithNutrition = ScraperProduct & {
  kcal: number | null;
  sugar: number | null;
  kohlenhydrate: number | null;
  coffein: number | null;
  taurin: number | null;
};
