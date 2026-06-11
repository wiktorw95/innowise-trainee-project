import { redirect } from 'next/navigation';

export default function HomePage() {
  // Automatycznie przekierowuje z głównej strony (/) prosto do logowania
  redirect('/auth/signin');
}
