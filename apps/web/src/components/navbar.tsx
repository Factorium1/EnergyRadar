import { Search } from 'lucide-react';

const Navbar = () => {
  return (
    <div className='sticky top-0 z-200 w-full bg-[#1a1f71] shadow-[0_2px_16px_rgba(26,31,113,0.3)]'>
      <div className='mx-auto flex h-15.5 max-w-7xl items-center gap-5 px-7'>
        <div className='flex shrink-0 cursor-pointer select-none items-baseline gap-px'>
          <span className='text-xl font-black tracking-tight text-white'>
            Energy
          </span>
          <span className='text-xl font-black tracking-tight text-orange-500'>
            Radar
          </span>
          <span className='ml-px text-xs font-semibold text-white/45'>.de</span>
        </div>
        <div className='hidden w-full max-w-135 md:flex md:flex-1'>
          <div className='flex h-10 items-center gap-2.5 rounded-full bg-white py-0 pl-4 pr-1.5 w-full'>
            <Search size={15} strokeWidth={2.5} className='text-gray-400' />
            <input
              type='text'
              placeholder='Energydrink, Marke, Geschmack…'
              className='flex-1 border-none bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none'
            />
            <div className='flex h-7.5 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full bg-orange-500 px-4 text-xs font-extrabold text-white hover:bg-orange-600'>
              Suchen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
