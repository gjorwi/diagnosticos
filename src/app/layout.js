import './globals.css';
import { Providers } from '@/components/providers';

export const metadata = {
  title: 'Registros Epidemiológicos',
  description: 'Digitalización de registros y reportes epidemiológicos (EPI13)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
