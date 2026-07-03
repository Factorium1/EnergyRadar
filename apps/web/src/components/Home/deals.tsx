import { useQuery } from '@tanstack/react-query';
import ProductCard from './product-card';
import { CircleLoader } from 'react-spinners';

type DealsType = {
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

async function fetchDeals(): Promise<DealsType[]> {
  const res = await fetch('http://localhost:8000/api/v1/deals');
  return res.json();
}

const HomeDeals = () => {
  const { data, isLoading, isError } = useQuery<DealsType[]>({
    queryKey: ['deals'],
    queryFn: fetchDeals,
  });
  return (
    <div className='flex items-center gap-5 flex-col w-full'>
      <div className='flex flex-col items-start gap-5 justify-center w-full'>
        <span className='text-3xl font-bold'>Top Angebote</span>
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full'>
        {isLoading && <CircleLoader color='blue-500' />}
        {isError && (
          <span className='font-semibold text-md text-red-500'>
            An Error occured
          </span>
        )}
        {data &&
          data
            ?.slice(0, 5)
            .map((product, index) => (
              <ProductCard
                key={product.id}
                brand={product.brand.name}
                title={product.name}
                slug={product.slug}
                change={product.change}
                price={product.price}
                median={product.median}
                img={product.imageUrl}
                index={index}
              />
            ))}
      </div>
    </div>
  );
};

export default HomeDeals;
