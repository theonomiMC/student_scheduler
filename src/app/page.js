// app/page.js or any component
'use client';
import dynamic from 'next/dynamic';
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
});
import { supabase } from '@/lib/supabaseClient';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [semesterIndex, setSemesterIndex] = useState(0);

  const mondayInitialDate = getMondayOfCurrentWeek()
  const allSemesters = [1, 2, 3, 4, 5, 6];
  const autoplayRef = useRef(null); // Moved up — always define refs before use
  const intervalRef = useRef(null); // This is now optional if unused elsewhere

  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  // Fetch current user on load and listen for auth state change
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch semester list from DB
  useEffect(() => {
    const loadSemesters = async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select('semester');

      if (error) {
        console.error('Failed to fetch semesters:', error);
        return;
      }

      const uniqueSemesters = [...new Set(data.map(item => item.semester))].sort();
      setSemesters(uniqueSemesters);

      if (uniqueSemesters.length > 0) {
        setCurrentSemester(uniqueSemesters[0]);
      }
    };

    loadSemesters();
  }, []);

  // Autoplay: start if no user
  useEffect(() => {
    if (!user && semesters.length > 0) {
      startAutoplay();
    } else {
      stopAutoplay();
    }

    return () => stopAutoplay();
  }, [user, semesters]);

  // Autoplay logic
  const startAutoplay = () => {
    if (autoplayRef.current) return;

    autoplayRef.current = setInterval(() => {
      setSemesterIndex(prev => {
        const next = (prev + 1) % semesters.length;
        setCurrentSemester(semesters[next]);
        return next;
      });
    }, 5000);
  };

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  // Manually stop autoplay when user selects a semester
  const handleManualSemesterChange = (idx) => {
    stopAutoplay();
    setSemesterIndex(idx);
    setCurrentSemester(semesters[idx]);
  };

  // Fetch events when semester changes
  const fetchEvents = useCallback(async (semesterId) => {
    try {
      const eventsData = await getSemester(semesterId);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, []);

  useEffect(() => {
    if (currentSemester) {
      fetchEvents(currentSemester);
    }
  }, [currentSemester]);
  // useEffect(() => {
  //   let interval;

  //   const startPolling = () => {
  //     if (interval) clearInterval(interval);
  //     interval = setInterval(() => {
  //       if (document.visibilityState === 'visible') {
  //         fetchEvents(currentSemester);
  //       }
  //     }, 15000); // every 15 seconds
  //   };

  //   startPolling();

  //   // Clear interval on unmount
  //   return () => clearInterval(interval);
  // }, [currentSemester, fetchEvents]);



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
        className={`fc-event-custom-content relative group
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
          <div className="fc-event-time text-xs font-bold text-gray-700">
            {timeText}
          </div>
        )}
        <div className="fc-event-title font-medium text-sm text-gray-800 text-pretty">
          {title || ''}
        </div>
        {(room || professor) && (
          <div className="text-xs text-gray-600 flex flex-col mt-0.5">
            {room && <span className='fc-event-room text-blue-900 font-medium'>{!rescheduled && "Rm:"} {room}</span>}
            {professor && <span className='hidden sm:inline text-[0.975em] text-blue-800 italic'>({professor})</span>}
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
  // console.log(events)
  return (
    <div className="calendar-container flex flex-col h-screen relative">


      {/* Add class button */}
      <div className='tools'>
        <AuthButton />
        {user && (<div className='flex gap-3 border-l-2 border-r-2 px-2 border-gray-100'>
          <button type='button'
            onClick={() => setShowForm(prev => !prev)}
            className='px-1 flex items-center gap-2 text-[0.8em] max-h-max text-blue-800
           cursor-pointer font-medium text-center transition-all
           duration-500 hover:text-red-600'>
            <svg width='10' height='10' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M1.22229 5.00011H8.77785M5.00007 8.77789V1.22233' stroke='#5551FF' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'></path>
            </svg> {showForm ? 'Hide Form' : 'Add'}
          </button>
          {/* Reset button */}
          <button type='button'
            onClick={handleResetRescheduled}
            className='reset-btn'>
            Reset
          </button>
        </div>
        )}
        {/* Semesters */}
        {user && <div className="">
          <span className="text-lg">🎓: </span>
          {semesters && semesters.map((sem, idx) => {
            const isActive = currentSemester === sem;
            const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
            return (
              <button
                key={idx}
                onClick={() => handleManualSemesterChange(idx)}
                className={`py-2 px-2 text-sm font-semibold
                   transition-all
                  duration-500 hover:text-red-600
          ${isActive
                    ? 'text-red-600'
                    : 'text-slate-700'
                  }`}
              >
                {ROMAN_NUMERALS[sem - 1]}
              </button>
            );
          })}

        </div>}
      </div>
      <div className="h-screen flex flex-col"
      >
        {user && showForm && (
          <div className={`transition-all duration-500 ease-in-out ${showForm ? 'max-h-[500px] opacity-100 mt-4 mb-8' : 'max-h-0 opacity-0'}`}
            onTransitionEnd={(e) => {
              if (!showForm && e.propertyName === 'max-height') {
                e.currentTarget.style.height = '0px';
              }
            }}
          >
            <EventForm onSave={handleEventSaved} semester={currentSemester} existingEvent={selectedEvent} />
          </div>
        )}

        <div
          className="calendar-wrapper flex-grow h-screen">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialDate={mondayInitialDate}
            initialView="timeGridWeek"
            slotMinTime="09:00:00"
            slotMaxTime="18:50:00"
            height="100%"
            expandRows={true}
            // contentHeight="auto"
            allDaySlot={false}
            hiddenDays={[0]}
            timeZone="local"
            nowIndicator={true}
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
              left:
                // !!user ? 'handleResetRescheduled' :
                '',
              center: 'title currentsemesterbutton',
              right: ''

            }}
            customButtons={{
              // handleResetRescheduled: {
              //   text: 'RESET',
              //   click: handleResetRescheduled,
              // }, 
              currentsemesterbutton: {
                text: `(Semester ${currentSemester})`,
                click: () => { }
              }
            }}

          />
        </div>
      </div>
    </div>
  );
}
