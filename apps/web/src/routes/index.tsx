import { createFileRoute } from '@tanstack/react-router';
import HomeHeader from '../components/Home/header';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <HomeHeader />
    </>
  );
}
