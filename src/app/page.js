// app/page.js or any component
'use client';
import dynamic from 'next/dynamic';
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
});
import { supabase } from '@/lib/supabaseClient';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState, useCallback } from 'react';
import { getSemester, resetRescheduledEvents, handleEventDrop, deleteEvent } from './api/semester/route';
import { getMondayOfCurrentWeek } from '@/utils/helper';
import EventForm from './input';
import AuthButton from './authButton';
import './calendar.css'
import './globals.css';



export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null);

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
  const fetchEvents = useCallback(async (semesterId) => {
  try {
    const eventsData = await getSemester(semesterId);
    setEvents(eventsData);
  } catch (error) {
    console.error("Error fetching events:", error);
  }
}, []);
// useEffect(() => {
//   if (!user) return;

//   const channel = supabase
//     .channel('schedule-changes-${user?.id}-${currentSemester}')
//     .on(
//       'postgres_changes',
//       {
//         event: '*',
//         schema: 'public',
//         table: 'schedule',
//       },
//       (payload) => {
//         fetchEvents(currentSemester);
//       }
//     )
//     .subscribe();

//   return () => {
//     supabase.removeChannel(channel);
//   };
// }, [user, currentSemester,fetchEvents]);

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
      if (uniqueSemesters.length > 0 && !currentSemester) {
        setCurrentSemester(uniqueSemesters[0]);
      }
    };

    loadSemesters();
  }, []);

  // const fetchEvents = async (semesterId) => {
  //   try {
  //     const eventsData = await getSemester(semesterId);
  //     setEvents(eventsData);
  //   } catch (error) {
  //     console.error("Error fetching events:", error);
  //   }
  // };
  useEffect(() => {
    if (currentSemester) {
      fetchEvents(currentSemester);
    }
  }, [currentSemester]);
// Optional: Polling every 5 minutes (for read-only users like students)
useEffect(() => {
  let interval;

  const startPolling = () => {
    interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchEvents(currentSemester);
      }
    }, 15000);
  };

  startPolling();
}, [currentSemester, fetchEvents]);

  const handleEventSaved = () => {
    fetchEvents(currentSemester);
    setShowForm(false);
    setSelectedEvent(null)
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
        setSelectedEvent(null)
        setShowForm(false);
        fetchEvents(currentSemester)
      }
    }
    const handleEdit = () => {
      // console.log(event.start, event.end,'selected to edit')
      setSelectedEvent(event);
      setShowForm(true);
    };
    const tooltipText = `${title}
      ${timeText}
      Room: ${room || ''}
      Prof. ${professor || ''}
      Semester: ${currentSemester || ''}
      ${rescheduled ? ' (Rescheduled)' : ''}`;
    return (
      <div
        className={`fc-event-custom-content relative group p-2
           rounded-md shadow-sm transition sm:text-sm text-[10px]
        ${rescheduled ? 'bg-brand-yellow' : 'bg-white'}
      `}
        title={tooltipText}
      >
        {/* ❌ Delete Button */}
        {user && (<button
          onClick={handleDelete}
          className="absolute top-1 right-1 text-xs text-red-500 hover:text-red-700 bg-white rounded-full px-1 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Delete"
        >
          ❌
        </button>)}
        {user && (<button
          onClick={handleEdit}
          className="absolute top-1 left-1 text-xs text-blue-500 hover:text-blue-700 bg-white rounded-full px-1 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Edit"
        >
          🖉
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
          <div className="fc-event-room text-xs text-gray-600">{!rescheduled && "Rm:"} {room}</div>
        )}
         {professor && (
            <div className="text-xs text-gray-600 mt-0.5">
                Prof. {professor}
            </div>
          )}
      </div>
    )
  };

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
      <div style={{ flexGrow: 1, position: 'relative', marginTop: "1rem" }}>
        {user && <button type='button'
          onClick={() => setShowForm(prev => !prev)}
          className='py-2.5 px-6 flex items-center gap-2 text-sm max-h-max text-blue-800
           cursor-pointer font-medium text-center transition-all
           duration-500 hover:text-red-600'>
          <svg width='10' height='10' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M1.22229 5.00011H8.77785M5.00007 8.77789V1.22233' stroke='#5551FF' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'></path>
          </svg> {showForm ? 'Hide Form' : 'Add Class'}
        </button>}

        <div className="border-b flex justify-end space-x-4 items-center">
          <span className="text-lg">🎓: </span>
          {semesters && semesters.map((sem, idx) => {
            const isActive = currentSemester === sem;
            const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
            return (
              <button
                key={idx}
                onClick={() => setCurrentSemester(sem)}
                className={`py-2 px-2 text-sm font-semibold
                   transition-all
                  duration-500 hover:text-red-600
          ${isActive
                    ? 'text-red-600'
                    : 'text-slate-700'
                  }`}
              >
                {ROMAN_NUMERALS[sem-1]}
              </button>
            );
          })}

        </div>
      </div>
      <div className="min-h-screen flex flex-col">
        {user && showForm && (
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showForm ? 'max-h-[500px] opacity-100 mt-4 mb-8' : 'max-h-0 opacity-0'}`}
            onTransitionEnd={(e) => {
              if (!showForm && e.propertyName === 'max-height') {
                e.currentTarget.style.height = '0px';
              }
            }}
          >
            <EventForm onSave={handleEventSaved} semester={currentSemester} existingEvent={selectedEvent} />
          </div>
        )}

        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialDate={mondayInitialDate}
          initialView="timeGridWeek"
          slotMinTime="09:00:00"
          slotMaxTime="18:50:00"
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
            await handleEventDrop(info);
            fetchEvents(currentSemester);
          }}
          eventMinHeight={30}
          headerToolbar={{
            left: !!user ? 'handleResetRescheduled' : '',
            center: 'title',
            right: ''

          }}
          customButtons={{
            handleResetRescheduled: {
              text: 'RESET',
              click: handleResetRescheduled,
            },

          }}
        />
      </div>
    </div>
  );
}
