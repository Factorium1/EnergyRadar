import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  ChevronRightIcon,
  ClockIcon,
  LineChartIcon,
  SigmaIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { CircleLoader } from 'react-spinners'
import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const CHART = {
  series: '#2a78d6',
  best: '#0ca30c',
  grid: '#e5e7eb',
  axis: '#9ca3af',
  surface: '#ffffff',
}

type BrandType = {
  id: string
  name: string
  slug: string
  imageUrl?: string
}

type SellerType = {
  id: string
  name: string
  slug: string
  imageUrl?: string | null
  shopUrl?: string | null
}

type OfferType = {
  id: string
  productUrl: string
  price: string | number
  currency: string
  shippingCost?: string | number | null
  freeShippingFrom?: string | number | null
  inStock: boolean
  lastCheckedAt: string
  lastChangedAt: string
  seller: SellerType
}

type TimelinePoint = {
  date: string
  price: number
  sellerCount: number
}

type ProductType = {
  id: string
  line: string
  name: string
  slug: string
  volumeMl: number
  ean?: string | null
  imageUrl?: string | null
  kcal?: number | null
  sugar?: number | null
  carbs?: number | null
  caffeine?: number | null
  taurine?: number | null
  sugarFree?: boolean | null
  source?: string | null
  brandId: string
  brand: BrandType
  offers: OfferType[]
  priceTimeline: TimelinePoint[]
  median: number
  price: string | null
  bestOfferId: string | null
  sellerCount: number
  change: number
}

function sellerInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function shippingLabel(offer: OfferType) {
  if (offer.freeShippingFrom != null) {
    return `Kostenlos ab ${euro.format(Number(offer.freeShippingFrom))}`
  }
  if (offer.shippingCost != null) {
    return `${euro.format(Number(offer.shippingCost))} Versand`
  }
  return 'Click & Collect'
}

const euro = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
})

const dateFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const chartDateFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
})

function formatRelative(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 60) return `vor ${Math.max(minutes, 1)} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? 'vor 1 Tag' : `vor ${days} Tagen`
}

function pricePerLiter(price: number, volumeMl: number) {
  return volumeMl > 0 ? (price / volumeMl) * 1000 : 0
}

export const Route = createFileRoute('/$brand/$product')({
  component: RouteComponent,
})

function RouteComponent() {
  const { product } = Route.useParams()

  async function getProductBySlug(): Promise<ProductType> {
    const res = await fetch(`http://localhost:8000/api/v1/products/${product}`)
    if (!res.ok) throw new Error('Produkt konnte nicht geladen werden')
    return res.json()
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['productSlug', product],
    queryFn: getProductBySlug,
  })

  const chartData = useMemo(() => {
    if (!data) return []
    return data.priceTimeline.map((point) => ({
      label: chartDateFmt.format(new Date(point.date)),
      fullDate: dateFmt.format(new Date(point.date)),
      price: point.price,
      perLiter: pricePerLiter(point.price, data.volumeMl),
      sellerCount: point.sellerCount,
    }))
  }, [data])

  if (isLoading) {
    return (
      <div className="w-full min-h-svh bg-[#F0F2F5] flex items-center justify-center">
        <CircleLoader color="#2563eb" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="w-full min-h-svh bg-[#F0F2F5] flex items-center justify-center">
        <span className="font-semibold text-md text-red-500">
          {error?.message ?? 'Produkt nicht gefunden'}
        </span>
      </div>
    )
  }

  const bestPrice = Number(data.price ?? 0)
  const median = Number(data.median)
  const changePercent = median > 0 ? (data.change / median) * 100 : 0
  const isCheaper = data.change > 0

  const bestOffer =
    data.offers.find((offer) => offer.id === data.bestOfferId) ?? data.offers[0] ?? null
  const currency = bestOffer?.currency ?? 'EUR'
  const inStockCount = data.offers.filter((offer) => offer.inStock).length

  const lastChecked = data.offers.reduce<Date | null>((latest, offer) => {
    const checked = new Date(offer.lastCheckedAt)
    return latest === null || checked > latest ? checked : latest
  }, null)

  const highest = chartData.reduce((max, point) => Math.max(max, point.price), 0)

  const bestPoint = chartData.reduce<(typeof chartData)[number] | null>(
    (best, point) => (best === null || point.price <= best.price ? point : best),
    null,
  )

  const chartValues = [...chartData.map((point) => point.price), median]
  const chartMin = Math.min(...chartValues)
  const chartMax = Math.max(...chartValues)
  const chartPad = Math.max((chartMax - chartMin) * 0.15, 0.05)
  const yDomain: [number, number] = [Math.max(chartMin - chartPad, 0), chartMax + chartPad]

  const nutrition = [
    { label: 'Energie', value: data.kcal, unit: 'kcal' },
    { label: 'Zucker', value: data.sugar, unit: 'g' },
    { label: 'Kohlenhydrate', value: data.carbs, unit: 'g' },
    { label: 'Koffein', value: data.caffeine, unit: 'mg' },
    { label: 'Taurin', value: data.taurine, unit: 'mg' },
  ].filter((item) => item.value !== null && item.value !== undefined)

  return (
    <div className="w-full min-h-svh bg-[#F0F2F5]">
      <div className="px-5 py-8 flex flex-col items-start gap-6 max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 flex-wrap">
          <Link to="/" className="text-blue-600 text-sm tracking-tight hover:underline">
            Startseite
          </Link>
          <ChevronRightIcon size={14} className="text-gray-400" />
          <Link
            to="/$brand"
            params={{ brand: data.brand.slug }}
            className="text-blue-600 text-sm tracking-tight hover:underline"
          >
            {data.brand.name}
          </Link>
          <ChevronRightIcon size={14} className="text-gray-400" />
          <span className="text-sm tracking-tight text-gray-500">{data.name}</span>
        </nav>

        <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex items-center justify-center">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.name} className="max-h-80 w-full object-contain" />
            ) : (
              <div className="h-80 w-full rounded-xl bg-gray-100" />
            )}
          </div>

          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to="/$brand"
                  params={{ brand: data.brand.slug }}
                  className="px-2 py-1 text-[11px] uppercase tracking-wide bg-blue-600 text-white font-bold rounded-md"
                >
                  {data.brand.name}
                </Link>
                <span className="px-2 py-1 text-[11px] uppercase tracking-wide text-amber-700 bg-amber-100 font-bold rounded-md">
                  {data.line}
                </span>
                <span className="px-2 py-1 text-[11px] uppercase tracking-wide text-gray-600 bg-gray-100 font-bold rounded-md">
                  {data.volumeMl} ml
                </span>
                {data.sugarFree && (
                  <span className="px-2 py-1 text-[11px] uppercase tracking-wide text-green-700 bg-green-100 font-bold rounded-md">
                    Zuckerfrei
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {data.name}
                </h1>
                <span className="text-sm text-gray-500">
                  {data.brand.name} · {data.line} · {data.volumeMl}ml
                  {data.caffeine ? ` · ${data.caffeine}mg Koffein / 100ml` : ''}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${
                    isCheaper ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {isCheaper ? <TrendingDownIcon size={14} /> : <TrendingUpIcon size={14} />}
                  {Math.abs(changePercent).toFixed(1)}%
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-semibold text-green-600">
                  Auf Lager bei {inStockCount} von {data.sellerCount} Händlern
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-green-500 bg-green-50 p-6 flex flex-col gap-4">
              <span className="uppercase text-green-700 text-[11px] font-bold tracking-wide">
                Bester Preis
              </span>
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {currency === 'EUR'
                    ? euro.format(bestPrice)
                    : `${bestPrice.toFixed(2)} ${currency}`}
                </span>
                <span className="text-sm font-semibold text-gray-500 pb-1">
                  {euro.format(pricePerLiter(bestPrice, data.volumeMl))}/L
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-2 py-1 mb-0.5 ${
                    isCheaper ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {isCheaper ? '−' : '+'}
                  {Math.abs(changePercent).toFixed(0)}% {isCheaper ? 'unter Ø' : 'über Ø'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap border-t border-green-200 pt-4">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 shrink-0 rounded-lg bg-white border border-green-200 text-gray-700 text-xs font-bold flex items-center justify-center">
                    {bestOffer ? sellerInitials(bestOffer.seller.name) : 'ER'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {bestOffer ? `bei ${bestOffer.seller.name}` : 'Kein Angebot verfügbar'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {bestOffer ? `${shippingLabel(bestOffer)} · ` : ''}
                      Preis inkl. MwSt.
                      {lastChecked ? ` · geprüft ${formatRelative(lastChecked)}` : ''}
                    </span>
                  </div>
                </div>
                {bestOffer && (
                  <a
                    href={bestOffer.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                  >
                    Zum Shop <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            icon={<LineChartIcon size={16} />}
            value={String(data.sellerCount)}
            label="Händler"
          />
          <StatTile
            icon={<SigmaIcon size={16} />}
            value={euro.format(median)}
            label="Ø-Preis (Median)"
          />
          <StatTile
            icon={isCheaper ? <TrendingDownIcon size={16} /> : <TrendingUpIcon size={16} />}
            value={`${isCheaper ? '−' : '+'}${Math.abs(changePercent).toFixed(0)}%`}
            label={isCheaper ? 'unter Ø-Preis' : 'über Ø-Preis'}
            accent={isCheaper ? 'text-green-600' : 'text-red-600'}
          />
          <StatTile
            icon={<ClockIcon size={16} />}
            value={lastChecked ? formatRelative(lastChecked) : '—'}
            label="zuletzt geprüft"
          />
        </div>

        <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Preisentwicklung</h2>
              <span className="text-sm text-gray-500">
                Bester Preis pro Tag über alle Händler · letzte {chartData.length} Tage · Spanne{' '}
                {euro.format(chartMin)} – {euro.format(highest)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <svg width="16" height="4" aria-hidden>
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke={CHART.axis}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                </svg>
                Ø {euro.format(median)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART.best }}
                />
                Bestpreis
              </span>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 24, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.series} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={CHART.series} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeWidth={1} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: CHART.grid }}
                  tick={{ fill: CHART.axis, fontSize: 12 }}
                  minTickGap={24}
                  dy={8}
                />
                <YAxis
                  domain={yDomain}
                  width={64}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: CHART.axis, fontSize: 12 }}
                  tickFormatter={(value: number) => euro.format(value)}
                />
                <Tooltip
                  cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
                  content={<PriceTooltip median={median} />}
                />
                <ReferenceLine
                  y={median}
                  stroke={CHART.axis}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
                <Area
                  type="linear"
                  dataKey="price"
                  stroke={CHART.series}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#priceFill)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: CHART.series,
                    stroke: CHART.surface,
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
                {bestPoint && (
                  <ReferenceDot
                    x={bestPoint.label}
                    y={bestPoint.price}
                    r={5}
                    fill={CHART.best}
                    stroke={CHART.surface}
                    strokeWidth={2}
                    label={{
                      value: euro.format(bestPoint.price),
                      position: 'top',
                      offset: 12,
                      fill: '#374151',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 flex flex-col gap-1">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Preisvergleich</h2>
            <span className="text-sm text-gray-500">
              {data.offers.length} {data.offers.length === 1 ? 'Angebot' : 'Angebote'} · Preise
              inkl. MwSt.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide font-bold text-gray-500">
                    Händler
                  </th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide font-bold text-gray-500">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide font-bold text-gray-500 hidden sm:table-cell">
                    / Liter
                  </th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide font-bold text-gray-500 hidden md:table-cell">
                    Versand
                  </th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wide font-bold text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.offers.map((offer) => {
                  const offerPrice = Number(offer.price)
                  const isBest = offer.id === data.bestOfferId

                  return (
                    <tr key={offer.id} className={isBest ? 'bg-green-50/60' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 shrink-0 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hidden md:flex items-center justify-center">
                            {sellerInitials(offer.seller.name)}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                              {offer.seller.name}
                            </span>
                            {isBest && (
                              <span className="text-xs font-bold text-green-700 hidden md:inline">
                                ✓ Günstigstes Angebot
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-base font-bold text-gray-900 whitespace-nowrap tabular-nums">
                        {euro.format(offerPrice)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap tabular-nums hidden sm:table-cell">
                        {euro.format(pricePerLiter(offerPrice, data.volumeMl))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">
                        {shippingLabel(offer)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {offer.inStock ? (
                          <span className="text-xs font-semibold text-green-600">Auf Lager</span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400">Ausverkauft</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={offer.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            isBest
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                          }`}
                        >
                          <span className="hidden md:inline">Zum</span>
                          <span className="flex items-center gap-1">
                            Shop <ArrowUpRight size={14} />
                          </span>
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {nutrition.length > 0 && (
          <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Nährwerte</h2>
              <span className="text-sm text-gray-500">
                Angaben je 100 ml · Dose mit {data.volumeMl} ml
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {nutrition.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-1"
                >
                  <span className="text-[11px] uppercase tracking-wide font-bold text-gray-500">
                    {item.label}
                  </span>
                  <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                    {item.value} {item.unit}
                  </span>
                  <span className="text-xs text-gray-500">
                    {((Number(item.value) * data.volumeMl) / 100).toFixed(
                      item.unit === 'g' ? 1 : 0,
                    )}{' '}
                    {item.unit} je Dose
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type ChartPoint = {
  label: string
  fullDate: string
  price: number
  perLiter: number
}

function PriceTooltip({
  active,
  payload,
  median,
}: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
  median: number
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  const diff = median > 0 ? ((point.price - median) / median) * 100 : 0

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-lg px-3 py-2 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{point.fullDate}</span>
      <div className="flex items-center gap-2">
        <svg width="12" height="4" aria-hidden>
          <line x1="0" y1="2" x2="12" y2="2" stroke={CHART.series} strokeWidth="2" />
        </svg>
        <span className="text-base font-bold text-gray-900 tabular-nums">
          {euro.format(point.price)}
        </span>
      </div>
      <span className="text-xs text-gray-500 tabular-nums">
        {euro.format(point.perLiter)}/L ·{' '}
        <span className={diff <= 0 ? 'text-green-600' : 'text-red-600'}>
          {diff > 0 ? '+' : '−'}
          {Math.abs(diff).toFixed(1)}% vs. Ø
        </span>
      </span>
    </div>
  )
}

function StatTile({
  icon,
  value,
  label,
  accent = 'text-gray-900',
}: {
  icon: React.ReactNode
  value: string
  label: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
      <span className="text-gray-400">{icon}</span>
      <span className={`text-2xl font-extrabold tracking-tight ${accent}`}>{value}</span>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
  )
}
