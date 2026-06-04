import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PatronRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/administrateur');
  }, [router]);

  return (
    <main>
      <h1>Redirection...</h1>
      <p>Vous êtes redirigé vers le tableau de bord administrateur.</p>
    </main>
  );
}
