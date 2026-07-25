import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  Dot,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";

type BrandType = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
};

type PriceHistoryType = {
  id: string;
  price: number;
  currency: string;
  recordedAt: string;
  productId: string;
};

type ProductType = {
  id: string;
  line: string;
  name: string;
  slug: string;
  volumeMl: number;
  ean?: string;
  imageUrl?: string;
  kcal: number;
  sugar: number;
  carbs: number;
  caffeine: number;
  taurine: number;
  sugarFree: boolean;
  source: string;
  brandId: string;
  brand: BrandType;
  priceHistory: PriceHistoryType[];
  median: number;
  price: string;
  change: number;
};

export const Route = createFileRoute("/$brand/$product")({
  component: RouteComponent,
});

function RouteComponent() {
  const { brand, product } = Route.useParams();

  async function getProductBySlug(): Promise<ProductType> {
    const res = await fetch(`http://localhost:8000/api/v1/products/${product}`);
    return res.json();
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["productSlug", product],
    queryFn: getProductBySlug,
  });

  if (isLoading) {
    return <div className="p-5">Loading...</div>;
  }

  if (isError || !data) {
    return <div className="p-5">{error?.message ?? "Product not found"}</div>;
  }

  const changePercent = Math.abs((data.change / data.median) * 100).toFixed(1);
  const isCheaper = data.change > 0;

  return (
    <div className="p-5 flex gap-10 items-start w-full justify-center glex-col">
      <div className="flex items-start justify-center gap-2">
        <Link to="/" className="text-blue-600 text-sm tracking-tight">
          Startseite
        </Link>
        <ChevronRightIcon size={15} />
        <Link
          to="/$brand"
          params={brand}
          className="text-blue-600 text-sm tracking-tight"
        >
          {data.brand.name}
        </Link>
        <ChevronRightIcon size={15} />
        <span className="text-sm tracking-tight text-gray-500">{product}</span>
      </div>
      <div className="grid-cols-5 gap-5">
        <div className="col-span-1">
          <img src={data.imageUrl} alt="Product Img" />
        </div>
        <div className="col-span-4 flex items-start gap-10 justify-center flex-col">
          <div className="flex flex-col gap-5 items-start justify-center">
            <div className="flex items-center justify-center gap-2">
              <span className="p-2 text-xs tracking-tight bg-green-500 text-white font-semibold rounded-sm">
                {data.brand.name}
              </span>
              <span className="p-2 text-xs tracking-tight text-gray-500 font-semibold">
                {data.volumeMl}ml
              </span>
              <span className="p-2 text-xs tracking-tight text-amber-600 bg-amber-200 font-semibold rounded-sm">
                {data.line}
              </span>
            </div>
            <span className="text-2xl font-semibold">{data.name}</span>
            <span className="text-md text-gray-500">
              {data.name} <Dot size={10} /> {data.volumeMl}ml
            </span>
            <div className="flex items-start justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${
                  isCheaper
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {isCheaper ? (
                  <TrendingDownIcon size={14} />
                ) : (
                  <TrendingUpIcon size={14} />
                )}
                {changePercent}%
              </span>
              <span>|</span>
              <span className="text-green-600 text-sm font-semibold">
                Auf Lager bei 6 Händlern
              </span>
            </div>
          </div>
          <div className="flex flex-col p-5 items-start justify-center gap-5 outline-1 outline-green-500 bg-green-500/30">
            span.uppercase.text-gray-500.
          </div>
        </div>
      </div>
    </div>
  );
}
