

export default function CalendarTable({ events }) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    console.log(events)
  return (
    <table className="border w-full table-fixed text-sm">
      <thead>
        <tr>
          <th className="border p-2 w-1/6">Time</th>
          {days.map((day) => (
            <th key={day} className="border p-2">{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 12 }, (_, i) => {
          const hour = 8 + i; // from 8am to 8pm
          const timeLabel = `${hour}:00 - ${hour + 1}:00`;

          return (
            <tr key={hour}>
              <td className="border p-2">{timeLabel}</td>
              {days.map((_, dayIndex) => {
                const cellEvents = events.filter(e => {
                  const day = e.rs_day ?? e.day_of_week;
                  const start = e.rs_start ?? e.start;
                  return day === dayIndex && start === hour;
                });

                return (
                  <td key={dayIndex} className="border p-2 h-12 align-top">
                    {cellEvents.map((e, idx) => (
                      <div key={idx} className="bg-blue-200 text-blue-900 px-1 rounded">
                        {e.name ?? 'Class'} ({e.room ?? e.rs_room})
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
