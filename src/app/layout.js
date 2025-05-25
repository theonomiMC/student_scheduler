export const metadata = {
  title: 'Student Schedule | East-West University',
  description: 'Descover university class schedule for semester I-VI, class locations, professors, time',
  keywords: ['Nato', 'Bakakuri', 'schedule', 'University', 'university timetable', 'east-west'],
  authors: [{ name: 'Natalia Bakakuri' }, { name: 'Nato Bakakuri' }],
  verification:{
    google:"T6Cqpe-jgPPRE1ynDXPBV-yp1JXY8jFaiHcmcTLp7Qs"
  },
  creator: 'Natalia Bakakuri',
};
export default function Layout({ children }) {
 
  return (
    <html lang="en">
      <body>    
        {children}
      </body>
    </html>
  );
}
