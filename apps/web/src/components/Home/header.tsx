import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ClipLoader } from 'react-spinners';

async function fetchBrands() {
  const res = await fetch('http://localhost:8000/api/v1/brands');
  return res.json();
}

const HomeHeader = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  return (
    <div className='relative w-full overflow-hidden bg-linear-to-br from-[#0f1450] via-[#1a1f71] to-[#1e2485] px-7 pt-16 pb-20 text-center'>
      <div className='pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-orange-500/6' />
      <div className='pointer-events-none absolute -bottom-16 -left-16 h-60 w-60 rounded-full bg-white/3' />

      <div className='relative mx-auto flex max-w-2xl flex-col items-center'>
        <div className='flex flex-col'>
          <span className='text-[46px] leading-[1.1] font-black tracking-tight text-white'>
            Energydrinks zum
          </span>
          <span className='text-[46px] leading-[1.1] font-black tracking-tight text-orange-500'>
            günstigsten Preis
          </span>
        </div>

        <span className='mt-3.5 mb-9 text-base font-medium text-white/65'>
          Monster, Red Bull, Rockstar und mehr — Preisvergleich aus über 5
          Online-Shops
        </span>

        <div className='flex w-full max-w-155 items-center gap-3 rounded-[28px] bg-white py-2 pr-2 pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]'>
          <Search size={20} className='shrink-0 text-gray-400' />
          <span className='flex-1 text-left text-[15px] font-medium text-gray-400'>
            z.B. Monster Energy Original 500ml...
          </span>
          <div className='hidden md:inline shrink-0 cursor-pointer rounded-[22px] bg-orange-500 px-7 py-3.5 transition-colors hover:bg-orange-600'>
            <span className='text-[15px] font-extrabold whitespace-nowrap text-white'>
              Jetzt vergleichen
            </span>
          </div>
        </div>

        {isError && (
          <span className='mt-5 font-semibold text-red-500'>
            {error.message}
          </span>
        )}

        <div className='mt-8 flex flex-wrap items-center justify-center gap-2'>
          <span className='text-xs font-semibold text-white/45'>Beliebt:</span>
          {isLoading && (
            <ClipLoader color='white' size={16} aria-label='Loading Spinner' />
          )}
          {data &&
            data.map(
              (brand: {
                id: string;
                name: string;
                slug: string;
                imageUrl?: string;
              }) => (
                <span
                  key={brand.id}
                  className='cursor-pointer rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/85 transition-colors hover:bg-white/18'
                >
                  {brand.name}
                </span>
              ),
            )}
        </div>
      </div>
    </div>
  );
};

export default HomeHeader;
