export async function GET() {
  return new Response(
    'google-site-verification: google9f2e57cbab9b8f70.html',
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}
