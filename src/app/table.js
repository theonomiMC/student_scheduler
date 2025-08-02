import React from 'react';

const SemesterTable = ({ events = [], semesterNumber }) => {
  // Days of the week (Monday to Saturday)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAbbr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Time slots from 9:00 to 18:00 (only full hours)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to find slot index for a given time
  const findSlotIndex = (timeStr) => {
    const eventMinutes = timeToMinutes(timeStr);

    // Find the exact slot or the one just before
    for (let i = 0; i < timeSlots.length; i++) {
      const slotMinutes = timeToMinutes(timeSlots[i]);
      if (slotMinutes === eventMinutes) {
        return i;
      }
      if (slotMinutes > eventMinutes) {
        return Math.max(0, i - 1);
      }
    }
    return timeSlots.length - 1;
  };

  // Get current week dates for header display
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    return days.map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  };

  const weekDates = getCurrentWeekDates();

  // Convert events to positioned format for CSS Grid
  const processEventsForGrid = () => {
    const processedEvents = [];

    events.forEach(event => {
      // Convert UTC to local time
      const eventStartDate = new Date(event.start);
      const eventEndDate = new Date(event.end);

      // Check if event spans multiple days
      const startDay = eventStartDate.getDate();
      const endDay = eventEndDate.getDate();

      if (startDay !== endDay) {
        // Split multi-day events into separate single-day events
        const currentDate = new Date(eventStartDate);

        while (currentDate.getDate() <= endDay && currentDate <= eventEndDate) {
          const dayStart = new Date(currentDate);
          dayStart.setHours(Math.max(9, eventStartDate.getHours()),
            currentDate.getDate() === startDay ? eventStartDate.getMinutes() : 0, 0, 0);

          const dayEnd = new Date(currentDate);
          if (currentDate.getDate() === endDay) {
            dayEnd.setHours(eventEndDate.getHours(), eventEndDate.getMinutes(), 0, 0);
          } else {
            dayEnd.setHours(18, 0, 0, 0);
          }

          // Only process if within our time range (9-18)
          if (dayStart.getHours() < 18 && dayEnd.getHours() >= 9) {
            const singleDayEvent = {
              ...event,
              start: dayStart.toISOString(),
              end: dayEnd.toISOString(),
              id: `${event.id}-${currentDate.getDate()}`
            };

            processedEvents.push(processSingleEvent(singleDayEvent));
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Single day event
        const processed = processSingleEvent(event);
        if (processed) {
          processedEvents.push(processed);
        }
      }
    });

    return processedEvents.filter(event => event !== null);
  };

  const processSingleEvent = (event) => {
    const eventStartDate = new Date(event.start);
    const eventEndDate = new Date(event.end);

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = eventStartDate.getDay();

    // Skip Sunday since we only show Mon-Sat
    if (dayOfWeek === 0) return null;

    // Map to our days array (Monday = 0, Tuesday = 1, etc.)
    const dayIndex = dayOfWeek - 1;
    if (dayIndex < 0 || dayIndex >= days.length) return null;

    // Get local time strings
    const startTime = eventStartDate.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = eventEndDate.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Find start and end slot indices
    const startSlotIndex = timeSlots.findIndex(t => t === startTime);
    const endSlotIndex = timeSlots.findIndex(t => t === endTime);

    if (startSlotIndex === -1) return null;

    // Calculate span - ensure it doesn't extend beyond the end time
    let spanCount = 1;
    if (endSlotIndex > startSlotIndex) {
      spanCount = endSlotIndex - startSlotIndex;
    }

    // For events that end at a half-hour mark, extend the span appropriately
    const endMinutes = timeToMinutes(endTime);
    const endSlotMinutes = timeToMinutes(timeSlots[endSlotIndex]);
    if (endMinutes > endSlotMinutes) {
      spanCount = Math.min(spanCount + 1, timeSlots.length - startSlotIndex);
    }

    return {
      ...event,
      startTime,
      endTime,
      dayIndex,
      startSlotIndex,
      spanCount,
      gridRow: dayIndex + 2, // +2 because grid starts at row 2 (after header row)
      gridColumn: startSlotIndex + 2, // +2 because grid starts at column 2 (after day column)
      gridColumnEnd: startSlotIndex + 2 + spanCount,
    };
  };

  const processedEvents = processEventsForGrid();

  // Group events by day and slot for overlap detection and font sizing
  const getEventsForCell = (dayIndex, slotIndex) => {
    return processedEvents.filter(event =>
      event.dayIndex === dayIndex &&
      event.startSlotIndex <= slotIndex &&
      (event.startSlotIndex + event.spanCount) > slotIndex
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Container with CSS Grid */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: `60px repeat(${timeSlots.length}, minmax(80px, 1fr))`, // Optimized column sizing
          gridTemplateRows: `30px repeat(${days.length}, minmax(80px, 1fr))`,        // Further reduced header height, increased row height
          gap: '1px',
          backgroundColor: '#e5e7eb',
          height: '100vh',
          overflow: 'auto',
          marginBottom: '1rem',
        }}
      >
        {/* Header Row - Time slots */}
        <div
          className="bg-gray-100 p-2 font-bold text-center text-gray-700 flex items-center justify-center border-r-2 border-gray-300"
          style={{ gridRow: 1, gridColumn: 1 }}
        >
        </div>
        
        {timeSlots.map((timeSlot, idx) => (
          <div
            key={timeSlot}
            className="bg-blue-50 px-1 py-0.5 font-bold text-center text-blue-900 flex items-center justify-center relative"
            style={{ gridRow: 1, gridColumn: idx + 2 }}
          >
            <div className="text-xs leading-tight">{timeSlot}</div>
            {/* Half-hour divider line */}
            {idx < timeSlots.length - 1 && (
              <div className="absolute right-0 top-1/2 w-full h-px bg-gray-300 opacity-30"
                style={{ transform: 'translateY(25%)' }} />
            )}
          </div>
        ))}

        {/* Day Rows and Grid Cells */}
        {days.map((day, dayIdx) => (
          <React.Fragment key={day}>
            {/* Day column */}
            <div
              className="bg-gray-100 p-2 font-bold text-center text-gray-700 flex flex-col items-center justify-center border-r-2 border-gray-300"
              style={{ gridRow: dayIdx + 2, gridColumn: 1 }}
            >
              <div className="text-sm mb-1">{dayAbbr[dayIdx]}</div>
              <div className="text-xs text-gray-600">
                {weekDates[dayIdx].getMonth() + 1}/{weekDates[dayIdx].getDate()}
              </div>
            </div>

            {/* Time slot columns for this day */}
            {timeSlots.map((timeSlot, timeIdx) => (
              <div
                key={`${day}-${timeSlot}`}
                className="relative bg-white hover:bg-gray-50 transition-colors duration-150"
                style={{ gridRow: dayIdx + 2, gridColumn: timeIdx + 2 }}
              />
            ))}
          </React.Fragment>
        ))}

        {/* Floating Events */}
        {processedEvents.map((event, idx) => {
          // Calculate position for overlapping events
          const overlappingEvents = getEventsForCell(event.dayIndex, event.startSlotIndex);
          const eventIndex = overlappingEvents.findIndex(e => e.id === event.id);
          const totalOverlapping = overlappingEvents.length;

          const heightPercentage = totalOverlapping > 1 ? 95 / totalOverlapping : 95;
          const topPercentage = totalOverlapping > 1 ? (eventIndex * heightPercentage) + 2.5 : 2.5;
          const fontSize =
            totalOverlapping >= 4 ? '0.55rem' :
              totalOverlapping === 3 ? '0.65rem' :
                totalOverlapping === 2 ? '0.7rem' : '0.8rem';
                
          return (
            <div
              key={`${event.id}-${idx}`}
              className={`rounded-md border-l-4 z-10 ${event.extendedProps?.rescheduled
                ? 'bg-yellow-50 border-yellow-400 hover:bg-yellow-100'
                : 'bg-white border-blue-400 hover:bg-blue-100'
                } transition-all duration-150 cursor-pointer shadow-sm border border-gray-200 m-0.5 p-1`}
              style={{
                gridRowStart: event.gridRow,
                gridRowEnd: event.gridRow + 1,
                gridColumnStart: event.gridColumn,
                gridColumnEnd: event.gridColumnEnd,
                ...(totalOverlapping > 1 && {
                  height: `${heightPercentage}%`,
                  marginTop: `${topPercentage}%`,
                  position: 'relative',
                })
              }}
            >
           
              <div className="h-full flex flex-col overflow-hidden max-h-full" style={{ fontSize }}>
                <div className="font-bold text-gray-900 leading-none mb-0.5">
                  {event.startTime} - {event.endTime}
                </div>
                <div className="font-semibold leading-tight mb-0.5 flex-1">
                  {event.title}
                </div>
                {event.extendedProps?.room && (
                  <div className="text-blue-600 leading-none mb-0.5">
                    Rm: {event.extendedProps.room}
                  </div>
                )}
                {event.extendedProps?.professor && (totalOverlapping <= 2 || event.extendedProps?.rescheduled) && (
                  <div className="text-blue-500 italic leading-none">
                    ({event.extendedProps.professor})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SemesterTable;