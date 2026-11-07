import AuthButton from './components/authButton';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://student-scheduler-psi.vercel.app'),
  title: 'East-West University Student Schedule | Semesters I-VI',
  description:
    'Discover the East-West University class schedule for semesters I-VI: classes, rooms, professors, and times.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'East-West University Student Schedule',
    description: 'Class schedule for semesters I-VI: rooms, professors, and times.',
    url: '/',
    siteName: 'Student Schedule',
    type: 'website',
  },
  authors: [{ name: 'Natalia Bakakuri' }],
  creator: 'Natalia Bakakuri',
  verification: {
    google: 'T6Cqpe-jgPPRE1ynDXPBV-yp1JXY8jFaiHcmcTLp7Qs',
  },
};
export default function Layout({ children }) {
 
  return (
    <html lang="en">
      <body>
        <AuthButton />
        {children}
      </body>
    </html>
  );
}
