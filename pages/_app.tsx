import { SpaceContext, useCurrentSpace, useCurrentUser, UserContext } from '@lib/context';
import AuthGuard from 'components/AuthGuard';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Provider as ZenStackHooksProvider } from '../lib/hooks';
import { Analytics } from '@vercel/analytics/react';
import { Barlow, League_Spartan } from 'next/font/google';
import '../styles/globals.css';
export const taskBody = Barlow({
  subsets: ['latin'],
  weight: ['400','600'],
  variable: '--font-task-body',
  display: 'swap',
});

export const taskTitle = League_Spartan({
  subsets: ['latin'],
  weight: ['600','700'],
  variable: '--font-task-title',
  display: 'swap',
});

function AppContent(props: { children: JSX.Element | JSX.Element[] }) {
    const user = useCurrentUser();
    const space = useCurrentSpace();

    return (
        <AuthGuard>
            <UserContext.Provider value={user}>
                <SpaceContext.Provider value={space}>
                    <div className="h-screen flex flex-col">{props.children}</div>
                </SpaceContext.Provider>
            </UserContext.Provider>
        </AuthGuard>
    );
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    return (
        <>
            <SessionProvider session={session}>
                <ZenStackHooksProvider value={{ endpoint: '/api/model' }}>
                    <AppContent>
                        <div className={`${taskBody.variable} ${taskTitle.variable}`}>
                            <Component {...pageProps} />
                            <ToastContainer position="top-center" autoClose={2000} hideProgressBar={true} />
                        </div>
                    </AppContent>
                </ZenStackHooksProvider>
            </SessionProvider>
            <Analytics />
        </>
    );
}

export default MyApp;
