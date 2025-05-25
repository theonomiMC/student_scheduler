// app/page.js or any component
'use client';

import FullCalendar from '@fullcalendar/react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation'
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState } from 'react';
import { getSemester, resetRescheduledEvents, handleEventDrop, insertEvent, deleteEvent } from './api/semester/route';
import './calendar.css'
import './globals.css';
import { getMondayOfCurrentWeek } from '@/utils/helper';
import Header from './header';
import EventForm from './input';
import AuthButton from './authButton';


export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null)
  const router = useRouter()
  const [semesters, setSemesters] = useState([])
  const [currentSemester, setCurrentSemester] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const mondayInitialDate = getMondayOfCurrentWeek()
  useEffect(() => {
  // Get initial user
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user)
  })

  // Listen for login/logout
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null)
  })

  return () => {
    listener.subscription.unsubscribe()
  }
}, [])

// console.log(user)
  // 1. Get all unique semesters (already in useEffect, good!)
  useEffect(() => {
    const loadSemesters = async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select('semester')
      if (error) {
        console.error('Failed to fetch semesters:', error);
        return;
      }
      const uniqueSemesters = [...new Set(data.map(item => item.semester))].sort();
      setSemesters(uniqueSemesters);
      // Optional: Set current semester to the first available if not already set
      if (uniqueSemesters.length > 0 && !currentSemester) {
        setCurrentSemester(uniqueSemesters[0]);
      }
    };

    loadSemesters();
  }, []);

  // 2. Define fetchEvents within the component (or even within the useEffect if it's only called there)
  // This function will be called *only* when you explicitly want to re-fetch.
  const fetchEvents = async (semesterId) => { // Accept semesterId as argument
    console.log(`Workspaceing events for semester: ${semesterId}`);
    try {
      const eventsData = await getSemester(semesterId);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      // Handle error gracefully, e.g., set an error state
    }
  };

  // 3. Use useEffect to trigger fetchEvents when currentSemester changes
  useEffect(() => {
    // Only fetch if currentSemester is valid
    if (currentSemester) {
      fetchEvents(currentSemester); // Call fetchEvents with the currentSemester
    }
  }, [currentSemester]);
  const handleEventSaved = () => { // This is for your EventForm onSave
    console.log("New event saved, refetching events...", currentSemester, typeof currentSemester);

    fetchEvents(currentSemester);
    setShowForm(false);
  };
  const renderEventContent = (eventInfo) => {

    const { timeText, event } = eventInfo
    if (!event) return null;

    const { id, title, extendedProps } = event;
    const { room, professor, rescheduled } = extendedProps || {};
    const handleDelete = async () => {
      const confirmed = confirm('Delete this event?');
      if (!confirmed) return;

      const result = await deleteEvent(id);
      if (!result.error) {
        setEvents((prev) => [...prev.filter((e) => e.id !== id)]);
        fetchEvents(currentSemester)
      }
    }
    const tooltipText = `${title}
      ${timeText}
      Room: ${room || ''}
      Prof. ${professor || ''}
      Semester: ${currentSemester || ''}
      ${rescheduled ? ' (Rescheduled)' : ''}`;
    return (
      <div
        className={`fc-event-custom-content relative group p-2 rounded-md shadow-sm transition 
        ${rescheduled ? 'bg-yellow-100 border-l-4 border-yellow-400' : 'bg-white'}
      `}
        title={tooltipText}
      >

        {/* ❌ Delete Button */}
       {user &&( <button
          onClick={handleDelete}
          className="absolute top-1 right-1 text-xs text-red-500 hover:text-red-700 bg-white rounded-full px-1 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Delete"
        >
          ❌
        </button>)}

        {timeText && (
          <div className="fc-event-time text-xs font-medium text-gray-700">
            {timeText}
          </div>
        )}
        <div className="fc-event-title font-semibold text-sm text-gray-800">
          {title || ''}
        </div>
        {room && (
          <div className="fc-event-room text-xs text-gray-600">Room: {room}</div>
        )}
        {professor && (
          <div className="fc-event-professor text-xs text-gray-500 italic">
            ({professor})
          </div>
        )}
        {rescheduled && (
          <div className="text-[10px] mt-1 font-bold uppercase text-yellow-700 tracking-wide">
            Rescheduled
          </div>
        )}
      </div>

    )
  };
  // const handleSelect = async (info) => {
  //   const title = prompt('Enter event title:');
  //   const room = prompt('Enter event location:');
  //   const rescheduled = confirm('Is this a rescheduled class?');

  //   const newEvent = {
  //     title,
  //     start: info.startStr.slice(11, 16), // "HH:MM"
  //     end: info.endStr.slice(11, 16),
  //     day_of_week: new Date(info.startStr).getDay() || 7,
  //     room,
  //     semester: currentSemester,
  //     rescheduled
  //   };

  //   const { error } = await insertEvent(newEvent);
  //   fetchEvents()
  //   if (!error) {
  //     const updated = await getSemester(currentSemester);
  //     setEvents(updated);
  //   }
  // };
  const handleResetRescheduled = async () => {
    const confirmed = confirm('Reset all rescheduled events?');
    if (!confirmed) return;

    const { error } = await resetRescheduledEvents();

    if (!error) {
      const updated = await getSemester(currentSemester);
      setEvents(updated);
    }
  };

  return (
    <div className="calendar-container">
      <AuthButton />
      <Header />
      <div style={{ flexGrow: 1, position: 'relative', marginTop: "1rem" }}>
        {user && <button type='button'
          onClick={() => setShowForm(prev => !prev)}
          className='py-2.5 px-6 flex items-center gap-2 text-sm max-h-max text-blue-600
           cursor-pointer font-medium text-center transition-all
           duration-500 hover:text-red-600'>
          <svg width='10' height='10' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M1.22229 5.00011H8.77785M5.00007 8.77789V1.22233' stroke='#5551FF' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'></path>
          </svg> {showForm ? 'Hide Form' : 'Add Class'}
          </button>}

        <div className="border-b flex justify-end space-x-4 items-center">
          {/* <span>Semester:</span> */}
          <span className="text-lg">🎓: </span>
          {semesters && semesters.map((sem, idx) => {
            const isActive = currentSemester === sem;
            return (
              <button
                key={idx}
                onClick={() => setCurrentSemester(sem)}
                className={`py-2 px-2 text-sm font-semibold
                   transition-all
                  duration-500 hover:text-red-600
          ${isActive
                    ? 'text-red-600'
                    : 'text-slate-700'//bg-blue-600 hover:bg-blue-700 text-white
                  }`}
              >
                {sem}
              </button>
            );
          })}

        </div>
      </div>
      <div className="min-h-screen flex flex-col">
        {showForm && (
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showForm ? 'max-h-[500px] opacity-100 mt-4 mb-8' : 'max-h-0 opacity-0'}`}
            onTransitionEnd={(e) => {
              if (!showForm && e.propertyName === 'max-height') {
                // Ensure the div truly has no height after transition if hidden
                e.currentTarget.style.height = '0px';
              }
            }}
          > {/* Added margin for spacing */}
            <EventForm onSave={handleEventSaved} semester={currentSemester} />
          </div>
        )}

        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialDate={mondayInitialDate}
          initialView="timeGridWeek"
          slotMinTime="09:00:00"
          slotMaxTime="18:30:00"
          height="auto"
          allDaySlot={false}
          hiddenDays={[0]}
          timeZone="local"
          editable={!!user}
          selectable={!!user}
          selectMirror={!!user}
          eventDurationEditable={!!user}
          eventContent={renderEventContent}
          events={events}
          // select={handleSelect}
          eventDrop={async (info) => {
            await handleEventDrop(info);         // Make sure your handleEventDrop accepts `info`
            fetchEvents(currentSemester);        // Re-fetch updated events
          }}
          // eventResize={async (info) => {
          //   const updated = {
          //     end: info.event.end.toISOString().slice(0, 5)
          //   };

          //   const { error } = await updateEvent(info.event.id, updated);
          //   if (error) {
          //     alert('Failed to resize event.');
          //     info.revert();
          //   }
          // }}
          eventMinHeight={30}
          headerToolbar={{
            left: !!user ? 'handleResetRescheduled' : '',
            center: 'title',
            right: ''

          }}
          customButtons={{
            handleResetRescheduled: {
              text: 'Reset Schedule',
              click: handleResetRescheduled,
            },

          }}
        />
      </div>
    </div>
  );
}
