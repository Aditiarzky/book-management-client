import { type ReactNode } from 'react';
import { Navigation } from '../../components/Navigation';
import { Footer } from '../../components/Footer';
import { RemoveParams } from '../../components/RemoveParam';

interface GuestLayoutProps {
  children: ReactNode;
}

const GuestLayout = ({ children }: GuestLayoutProps) => {
  return (
    <div>
    <RemoveParams />
      <Navigation />
      <main className='flex min-h-dvh flex-col w-full max-w-6xl mx-auto'>{children}</main>
      <footer className="mt-5">
        <Footer />
      </footer>
    </div>
  );
};

export default GuestLayout;