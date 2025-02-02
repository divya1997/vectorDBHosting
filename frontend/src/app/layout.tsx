import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { configureAmplify } from '@/config/amplify';

// Configure Amplify
configureAmplify();

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Vector DB Builder',
  description: 'Create and manage vector embeddings from your data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen">
          <div className="flex">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-72 md:flex-col fixed h-screen">
              <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg"></div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark text-transparent bg-clip-text">
                      Vector DB Builder
                    </h1>
                  </div>
                </div>
                <div className="mt-8 flex-grow flex flex-col px-4">
                  <Navigation />
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 md:pl-72">
              <main className="flex-1 py-8 px-6">
                {children}
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
