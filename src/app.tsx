import 'src/global.css';

import { useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { ThemeProvider } from 'src/theme/theme-provider';


// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  useCanonicalOrigin();
  useScrollToTop();


  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function useCanonicalOrigin() {
  useEffect(() => {
    const canonicalOrigin = import.meta.env.VITE_CANONICAL_ORIGIN as string | undefined;

    if (!canonicalOrigin || typeof window === 'undefined') {
      return;
    }

    if (window.location.origin === canonicalOrigin) {
      return;
    }

    const target = `${canonicalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, []);
}
