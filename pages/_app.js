import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import '../styles/globals.css';

function MyApp({ 
  Component, 
  pageProps: { session, ...pageProps } 
}) {
  return (
    <>
      <Head>
        <title>Tangerine Wellness Platform</title>
        <meta name="description" content="Holistic Wellness Platform" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <Navigation />
            <div className="pt-16">
              <Component {...pageProps} />
            </div>
            <ToastContainer 
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}

export default MyApp;
