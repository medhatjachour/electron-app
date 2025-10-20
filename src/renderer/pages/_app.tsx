import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: any) {
  // This file is retained for compatibility with any page imports — routing is handled by React Router in `src/App.tsx`.
  return <Component {...pageProps} />
}