'use client';

import dynamic from 'next/dynamic';
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
});
import { supabase } from '@/lib/supabaseClient';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getSemester, resetRescheduledEvents, handleEventDrop, deleteEvent, getAllSemesters } from './api/semester/route';
import { getMondayOfCurrentWeek } from '@/utils/helper';
import EventForm from './components/input';
import AuthButton from './components/authButton';
import './calendar.css';
import './globals.css';
import Loader from './components/loader';
import EventToolbar from './components/toolbar';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [semesters, setSemesters] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [semesterIndex, setSemesterIndex] = useState(0);
  const [serverOffline, setServerOffline] = useState(false)

  const mondayInitialDate = getMondayOfCurrentWeek();
  const autoplayRef = useRef(null);
  const autoplayIndexRef = useRef(0);
  const semesterCache = useRef({}); // Cache for semester data

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

  // Fetch all semesters at once.
  const fetchAllSemesters = useCallback(async () => {
    try {
      const grouped = await getAllSemesters();
      semesterCache.current = grouped;

      if (grouped[currentSemester]) {
        setEvents(grouped[currentSemester]);
      }
      setServerOffline(false)
    } catch (err) {
      console.error('Failed to fetch all semesters:', err);
      setServerOffline(true)
    }
  }, [currentSemester]);

  // Fetch semester list from DB
  useEffect(() => {
    const loadSemesters = async () => {
      const { data, error } = await supabase.from('schedule').select('semester');

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

  // Start event auto-play
  const startAutoplay = () => {
    if (autoplayRef.current) return;

    autoplayRef.current = setInterval(() => {
      if (semesters.length === 0) return;

      autoplayIndexRef.current = (autoplayIndexRef.current + 1) % semesters.length;
      const nextSemester = semesters[autoplayIndexRef.current];

      setSemesterIndex(autoplayIndexRef.current); // state still used for UI
      setCurrentSemester(nextSemester);

      if (semesterCache.current[nextSemester]) {
        setEvents(semesterCache.current[nextSemester]);
      } else {
        fetchEvents(nextSemester);
      }
    }, 4000);
  };
  // Stop event auto-play
  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  // Manually stop autoplay when user selects a semester
  const handleManualSemesterChange = (idx) => {
    stopAutoplay();
    autoplayIndexRef.current = idx;
    const sem = semesters[idx];
    setSemesterIndex(idx);
    setCurrentSemester(sem);

    if (semesterCache.current[sem]) {
      setEvents(semesterCache.current[sem]); // Use cached data
    } else {
      fetchEvents(sem); // Fetch if not cached
    }
  };

  // Fetch events when semester changes
  const fetchEvents = useCallback(async (semesterId, force = false) => {
    // Check cache first
    if (!force && semesterCache.current[semesterId]) {
      // console.log(`[Cache Hit] Serving events for semester ${semesterId} from cache.`);
      setEvents(semesterCache.current[semesterId]);
      return;
    }

    try {
      const eventsData = await getSemester(semesterId);
      semesterCache.current[semesterId] = eventsData; // Cache the data
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, []);

  useEffect(() => {
    if (semesters.length === 0) return;
    fetchAllSemesters();
    const intervalId = setInterval(fetchAllSemesters, 10 * 60 * 1000); // Refresh every 10 minutes
    return () => clearInterval(intervalId);
  }, [semesters, fetchAllSemesters]);

  // Save the Events
  const handleEventSaved = () => {
    fetchEvents(currentSemester, true); // Force refresh
    setShowForm(false);
    setSelectedEvent(null);
  };

  // Format Calender content
  const renderEventContent = (eventInfo) => {
    const { timeText, event } = eventInfo;
    if (!event) return null;

    const { id, title, extendedProps } = event;
    const { room, professor, rescheduled } = extendedProps || {};

    const handleDelete = async () => {
      const confirmed = confirm('Delete this event?');
      if (!confirmed) return;

      const result = await deleteEvent(id);
      if (!result.error) {
        fetchEvents(currentSemester, true); // Force refresh
        // setEvents((prev) => [...prev.filter((e) => e.id !== id)]);
        setSelectedEvent(null);
        setShowForm(false);
      }
    };
    const handleEdit = () => {
      // console.log(event.start, event.end,'selected to edit')
      setSelectedEvent(event);
      setShowForm(true);
    };
    const tooltipText = `${title}\n${timeText}\nRoom: ${room || ''}\nProf. ${professor || ''}\nSemester: ${currentSemester || ''}\n${rescheduled ? ' (Rescheduled)' : ''}`;
    return (
      <div
        className={`fc-event-custom-content relative group rounded-md shadow-sm transition sm:text-sm text-[10px] ${rescheduled ? 'bg-brand-yellow pt-[3px]' : 'bg-white'}`}
        title={tooltipText}
      >
        {/* ❌ Delete Button */}
        {user && (
          <button
            onClick={handleDelete}
            className="absolute top-1 right-1 text-xs text-red-500 hover:text-red-700 bg-white rounded-full px-1 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Delete"
          >
            ❌
          </button>
        )}
        {user && (
          <button
            onClick={handleEdit}
            className="absolute top-1 left-1 text-xs text-blue-500 hover:text-blue-700 bg-white rounded-full px-1 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Edit"
          >
            🖉
          </button>
        )}
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
            {room && <span className="fc-event-room text-blue-900 font-medium">Rm: {room}</span>}
            {professor && <span className="hidden sm:inline text-[0.975em] text-blue-800 italic">({professor})</span>}
          </div>
        )}
      </div>
    );
  };

  // Reset rescheduled events for all semesters
  const handleResetRescheduled = async () => {
    stopAutoplay()
    const confirmed = confirm('Reset all rescheduled events?');
    if (!confirmed) {
      startAutoplay
      return;
    }
    const { error } = await resetRescheduledEvents();

    if (!error) {
      const updated = await getSemester(currentSemester);
      setEvents(updated);
      await fetchEvents(currentSemester, true); // Force refresh
    }
    startAutoplay()
  };

  return (
    <div className="flex flex-col h-screen">
      {/* if no data, disable entire page */}
      {events.length ===0 || serverOffline ? (
        <Loader message={serverOffline ? 'Server offline. Trying to reconnect...' : "Loading schedule..."} />
      ) : (
      <>
        <EventToolbar user={user}
          showForm={showForm}
          setShowForm={setShowForm}
          handleResetRescheduled={handleResetRescheduled}
          semesters={semesters}
          currentSemester={currentSemester}
          handleManualSemesterChange={handleManualSemesterChange} />
        <div className="flex flex-col">
          {user &&
            showForm && (
              <div
                className={`transition-all duration-500 ease-in-out ${showForm ? 'max-h-[500px] opacity-100 mt-4 mb-8' : 'max-h-0 opacity-0'}`}
                onTransitionEnd={e => {
                  if (!showForm && e.propertyName === 'max-height') {
                    e.currentTarget.style.height = '0px';
                  }
                }}
              >
                <EventForm onSave={handleEventSaved} semester={currentSemester} existingEvent={selectedEvent} />
              </div>
            )}
          <div className="flex-grow h-[calc(100vh-60px)] overflow-hidden">
            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin]}
              initialDate={mondayInitialDate}
              initialView="timeGridWeek"
              slotMinTime="09:00:00"
              slotMaxTime="18:50:00"
              // height='auto'
              height="100%"
              expandRows={true}
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
              eventDrop={async info => {
                await handleEventDrop(info);
                fetchEvents(currentSemester, true); // Force refresh
              }}
              eventMinHeight={30}
              headerToolbar={{
                left: '',
                center: 'title currentsemesterbutton',
                right: 'eee',
              }}
              customButtons={{
                currentsemesterbutton: {
                  text: `(Semester ${currentSemester})`,
                  click: () => { },
                },
              }}
            />
          </div>
        </div>
      </>
      )}
    </div>
  );
}