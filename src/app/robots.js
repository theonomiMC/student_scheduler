export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://student-scheduler-psi.vercel.app/sitemap.xml',
  };
}
