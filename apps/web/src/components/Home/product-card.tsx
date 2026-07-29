import { Link } from '@tanstack/react-router'
import { ArrowRight, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

const ProductCard = ({
  brand,
  brandSlug,
  title,
  slug,
  change,
  price,
  median,
  img,
  label,
}: {
  brand: string
  brandSlug: string
  title: string
  slug: string
  change: number
  price: number
  median: number
  img?: string
  label?: string
}) => {
  const changePercent = Math.abs((change / median) * 100).toFixed(1)
  const isCheaper = change > 0

  return (
    <Link
      className="group flex flex-col items-stretch rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
      to="/$brand/$product"
      params={{ brand: brandSlug, product: slug }}
    >
      <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
        {img ? (
          <img src={img} alt={title} className="h-full w-full object-contain p-4" />
        ) : (
          <div className="h-full w-full bg-gray-100" />
        )}
        {label && (
          <span className="absolute top-3 left-3 rounded-md bg-orange-500 text-white tracking-tight font-bold text-xs px-2 py-1 shadow-sm">
            {label}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col items-start gap-1.5 flex-1">
        <span className="uppercase text-blue-700 text-[11px] font-bold tracking-wide">{brand}</span>
        <span className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {title}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${
            isCheaper ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}
        >
          {isCheaper ? <TrendingDownIcon size={14} /> : <TrendingUpIcon size={14} />}
          {changePercent}%
        </span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xs text-gray-500 font-medium">ab</span>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{price} €</span>
        </div>
        <div className="flex justify-end items-center mt-auto pt-3 w-full">
          <button className="flex items-center gap-1 px-3 py-2 text-white bg-blue-600 group-hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
            Vergleichen <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
