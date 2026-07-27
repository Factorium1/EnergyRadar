import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CircleLoader } from 'react-spinners';
import ProductCard from '../../components/Home/product-card';

type BrandProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  median: number;
  change: number;
  price: number | null;
};

type BrandResult = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  products: BrandProduct[];
};

export const Route = createFileRoute('/$brand/')({
  component: RouteComponent,
});

async function getBrand(brandSlug: string): Promise<BrandResult> {
  const res = await fetch(
    `http://localhost:8000/api/v1/brands/${encodeURIComponent(brandSlug)}`,
  );
  if (!res.ok) throw new Error(`Brand ${brandSlug} could not be loaded`);
  return res.json();
}

function RouteComponent() {
  const { brand: brandSlug } = Route.useParams();
  const [filter, setFilter] = useState('price-change');

  function changeFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    setFilter(e.target.value);
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['brand', brandSlug],
    queryFn: () => getBrand(brandSlug),
  });

  const products = data?.products;

  const filteredData = useMemo(() => {
    if (!products) return products;

    switch (filter) {
      case 'price-desc':
        return [...products].sort((a, b) => Number(b.price) - Number(a.price));

      case 'price-asc':
        return [...products].sort((a, b) => Number(a.price) - Number(b.price));

      case 'name':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));

      case 'price-change':
      default:
        return products;
    }
  }, [filter, products]);

  return (
    <div className='w-full min-h-svh bg-[#F0F2F5]'>
      <div className='px-5 py-10 flex flex-col items-start gap-5 max-w-7xl mx-auto'>
        <span className='text-3xl font-semibold'>{data?.name ?? ''}</span>
        <div className='w-full flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0'>
          <div className='inline'>
            <span className='font-bold text-sm tracking-tight'>
              {products?.length ?? 0}{' '}
            </span>
            <span className='font-semibold text-sm tracking-tight text-gray-500'>
              Ergebnisse gefunden
            </span>
          </div>
          <div className='flex gap-2 items-center'>
            <span className='font-semibold text-sm text-gray-700'>
              Sortieren:
            </span>
            <div className='relative'>
              <select
                name='sortBy'
                id='sortBy'
                value={filter}
                onChange={changeFilter}
                className='appearance-none rounded-xl border border-gray-100 bg-white py-2 pr-9 pl-3 text-sm font-semibold text-gray-900 shadow-sm cursor-pointer outline-none transition-colors hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40'
              >
                <option value='price-change'>Groesste aenderung</option>
                <option value='price-desc'>Preis absteigend</option>
                <option value='price-asc'>Preis aufsteigend</option>
                <option value='name'>Name A-Z</option>
              </select>
              <ChevronDown
                size={16}
                className='pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400'
              />
            </div>
          </div>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full'>
          {isLoading && <CircleLoader color='#2563eb' />}
          {isError && (
            <span className='font-semibold text-md text-red-500'>
              An Error occured
            </span>
          )}
          {data &&
            filteredData?.map((product) => (
              <ProductCard
                key={product.id}
                brand={data.name}
                brandSlug={data.slug}
                title={product.name}
                slug={product.slug}
                change={product.change}
                price={Number(product.price)}
                median={product.median}
                img={product.imageUrl}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
