import { createFileRoute } from '@tanstack/react-router'
import HomeHeader from '../components/Home/header'
import { useQuery } from '@tanstack/react-query'
import HomeBrands from '../components/Home/brands'
import HomeDeals from '../components/Home/deals'

export const Route = createFileRoute('/')({
  component: HomePage,
})

async function fetchBrands() {
  const res = await fetch('http://localhost:8000/api/v1/brands')
  return res.json()
}

function HomePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  })

  return (
    <>
      <HomeHeader data={data} isLoading={isLoading} isError={isError} error={error} />
      {/*<div className='flex items-center justify-center gap-10 w-full bg-white py-4'>
        sadflj
      </div>*/}
      <div className="w-full bg-[#F0F2F5]">
        <div className="flex flex-col items-start justify-center px-5 py-15 gap-15">
          <HomeDeals />
          <HomeBrands data={data} isLoading={isLoading} isError={isError} error={error} />
        </div>
      </div>
    </>
  )
}
