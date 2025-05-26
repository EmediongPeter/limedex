import './globals.css'
import { ClusterProvider } from '@/components/cluster/cluster-data-access'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { UiLayout } from '@/components/ui/ui-layout'
import { ReactQueryProvider } from './react-query-provider'
import { SwapProvider } from '@/contexts/ContextProvider'
import { SettingsProvider } from '@/contexts/SettingsContext'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'Lime Dex',
  description: 'Swap anytime, anywhere. The leading decentralized crypto trading protocol.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

const links: { label: string; path: string }[] = [
  { label: 'Account', path: '/account' },
  { label: 'Clusters', path: '/clusters' },
  { label: 'Counter Program', path: '/counter' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'Inter Fallback';
            font-style: normal;
            font-weight: 400;
            src: local('Arial');
            ascent-override: 90%;
            descent-override: 22%;
            line-gap-override: 0%;
            size-adjust: 107%;
          }
        `}} />
      </head>
      <body>
        <ReactQueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ClusterProvider>
              <SolanaProvider>
                <SwapProvider>
                  <SettingsProvider>
                    <UiLayout links={links}>{children}</UiLayout>
                  </SettingsProvider>
                </SwapProvider>
              </SolanaProvider>
            </ClusterProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
