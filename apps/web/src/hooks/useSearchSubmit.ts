import { useNavigate } from '@tanstack/react-router';

export function useSearchSubmit(searchValue: string) {
  const navigate = useNavigate();

  return function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (searchValue === '') {
      navigate({ to: '/' });
      return;
    }

    navigate({ to: '/search', search: { q: searchValue } });
  };
}
