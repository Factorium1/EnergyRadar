import { ClipLoader } from 'react-spinners';

const HomeBrands = ({
  data,
  isLoading,
  isError,
  error,
}: {
  data: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  }[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}) => {
  return (
    <div className='mx-auto w-full max-w-7xl'>
      <h2 className='mb-5 text-2xl text-gray-900 font-semibold'>
        Beliebte Marken
      </h2>

      {isError && error && (
        <span className='mb-5 block font-semibold text-red-500'>
          {error.message}
        </span>
      )}

      {isLoading && (
        <div className='flex items-center justify-center py-10'>
          <ClipLoader color='#1a1f71' size={24} aria-label='Loading Spinner' />
        </div>
      )}

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
        {data &&
          data.map((brand) => (
            <div
              key={brand.id}
              className='cursor-pointer rounded-xl border-2 border-transparent bg-white px-3 py-5.5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors hover:border-[#1a1f71] hover:shadow-[0_4px_16px_rgba(26,31,113,0.12)]'
            >
              <div className='mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#1a1f71]'>
                <span className='text-xl font-black text-white'>
                  {brand.name.charAt(0)}
                </span>
              </div>
              <div className='text-xs font-extrabold text-gray-900'>
                {brand.name}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default HomeBrands;
