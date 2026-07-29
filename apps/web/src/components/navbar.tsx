import { Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useSearchSubmit } from '../hooks/useSearchSubmit'

const Navbar = () => {
  const [searchValue, setSearchValue] = useState('')

  return (
    <div className="sticky top-0 z-200 w-full bg-[#1a1f71] shadow-[0_2px_16px_rgba(26,31,113,0.3)]">
      <div className="mx-auto flex h-15.5 max-w-7xl items-center gap-5 px-7">
        <Link to="/" className="flex shrink-0 cursor-pointer select-none items-baseline gap-px">
          <span className="text-xl font-black tracking-tight text-white">Energy</span>
          <span className="text-xl font-black tracking-tight text-orange-500">Radar</span>
          <span className="ml-px text-xs font-semibold text-white/45">.de</span>
        </Link>
        <div className="hidden w-full max-w-135 md:flex md:flex-1">
          <form
            className="flex h-10 items-center gap-2.5 rounded-full bg-white py-0 pl-4 pr-1.5 w-full"
            onSubmit={useSearchSubmit(searchValue)}
          >
            <Search size={15} strokeWidth={2.5} className="text-gray-400" />
            <input
              type="text"
              placeholder="Energydrink, Marke, Geschmack…"
              className="flex-1 border-none bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button
              type="submit"
              className="flex h-7.5 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full bg-orange-500 px-4 text-xs font-extrabold text-white hover:bg-orange-600"
            >
              Suchen
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Navbar
