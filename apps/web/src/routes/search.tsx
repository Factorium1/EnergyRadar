import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CircleLoader } from 'react-spinners';
import ProductCard from '../components/Home/product-card';
import { useMemo, useState } from 'react';

type SearchParams = {
  q?: string;
};

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  brand: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  };
  median: number;
  change: number;
  price: number;
};

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  component: RouteComponent,
});

async function getSearch(q: string): Promise<SearchResult[]> {
  const res = await fetch(
    `http://localhost:8000/api/v1/search?q=${encodeURIComponent(q)}`,
  );
  return res.json();
}

function RouteComponent() {
  const { q } = Route.useSearch();
  const navigation = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', q],
    queryFn: () => getSearch(q as string),
    enabled: q !== undefined,
  });

  const [filter, setFilter] = useState('price-change');

  function changeFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    setFilter(e.target.value);
  }

  const filteredData = useMemo(() => {
    if (!data) return data;

    switch (filter) {
      case 'price-desc':
        return [...data].sort((a, b) => b.price - a.price);

      case 'price-asc':
        return [...data].sort((a, b) => a.price - b.price);

      case 'name':
        return [...data].sort((a, b) => a.name.localeCompare(b.name));

      case 'brand':
        return [...data].sort((a, b) => a.brand.name.localeCompare(b.brand.name));

      case 'price-change':
      default:
        return data;
    }
  }, [filter, data]);

  if (q === undefined) {
    navigation({ to: '/' });
    return null;
  }

  return (
    <div className='w-full min-h-svh bg-[#F0F2F5]'>
      <div className='px-5 py-10 flex flex-col items-start gap-5'>
        <span className='text-3xl font-semibold'>
          Suchergebnisse fuer '{q}'
        </span>
        <div className='w-full flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0'>
          <div className='inline'>
            <span className='font-bold text-sm tracking-tight'>
              {data?.length ?? 0}{' '}
            </span>
            <span className='font-semibold text-sm tracking-tight text-gray-500'>
              Ergebnisse gefunden
            </span>
          </div>
          <div className='flex gap-2 items-center'>
            <span className='font-semibold text-sm text-gray-700'>
              Sortieren:
            </span>
            <select
              name='sortBy'
              id='sortBy'
              value={filter}
              onChange={changeFilter}
              className='border border-gray-500 rounded-sm px-2 py-1 font-semibold text-sm bg-white cursor-pointer outline-none focus:outline-none'
            >
              <option value='price-change'>Groesste aenderung</option>
              <option value='price-desc'>Preis absteigend</option>
              <option value='price-asc'>Preis aufsteigend</option>
              <option value='name'>Name A-Z</option>
              <option value='brand'>Marke A-Z</option>
            </select>
          </div>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full'>
          {isLoading && <CircleLoader color='blue-500' />}
          {isError && (
            <span className='font-semibold text-md text-red-500'>
              An Error occured
            </span>
          )}
          {filteredData?.map((product) => (
            <ProductCard
              key={product.id}
              brand={product.brand.name}
              title={product.name}
              slug={product.slug}
              change={product.change}
              price={product.price}
              median={product.median}
              img={product.imageUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
