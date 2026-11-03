import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rocky Business Manager - Freelance Business & Project Management SaaS',
  description: 'Complete personal freelance project management, business analytics, monthly planning, carry forward, and revenue tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  window.addEventListener('error', function(event) {
                    var source = (event.filename || '') + ' ' + ((event.error && event.error.stack) || '');
                    if (source.indexOf('chrome-extension:') !== -1 || source.indexOf('moz-extension:') !== -1 || source.indexOf('executors') !== -1) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                    }
                  }, true);
                  window.addEventListener('unhandledrejection', function(event) {
                    var reason = (event.reason && (event.reason.stack || event.reason.message)) || '';
                    if (reason.indexOf('chrome-extension:') !== -1 || reason.indexOf('moz-extension:') !== -1) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                    }
                  }, true);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
