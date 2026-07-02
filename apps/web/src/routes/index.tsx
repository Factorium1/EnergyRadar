import { createFileRoute } from '@tanstack/react-router';
import HomeHeader from '../components/Home/header';
import { useQuery } from '@tanstack/react-query';
import HomeBrands from '../components/Home/brands';

export const Route = createFileRoute('/')({
  component: HomePage,
});

async function fetchBrands() {
  const res = await fetch('http://localhost:8000/api/v1/brands');
  return res.json();
}

function HomePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  return (
    <>
      <HomeHeader
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />
      <div className='flex items-center justify-center gap-10 w-full bg-white py-4'>
        sadflj
      </div>
      <div className='w-full bg-white/10'>
        <div className='flex items-start justify-center gap-20 px-5 py-20'>
          <HomeBrands
            data={data}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </div>
      </div>
    </>
  );
}
