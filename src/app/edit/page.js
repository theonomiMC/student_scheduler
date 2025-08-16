'use client';

import dynamic from 'next/dynamic';
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
});
import { supabase } from '@/lib/supabaseClient';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSemester, resetRescheduledEvents, handleEventDrop, deleteEvent, getAllSemesters } from '../api/semester/route';
import { getMondayOfCurrentWeek, sanitizer } from '@/utils/helper';
import EventForm from '../components/input';
import Loader from '../components/loader';
import EventToolbar from '../components/toolbar';
import { PencilIcon } from 'lucide-react';
import '../calendar.css';
import '../globals.css';

export default function EditPage() {
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [semesters, setSemesters] = useState([]);
    const [currentSemester, setCurrentSemester] = useState(1);
    const [showForm, setShowForm] = useState(false);
    
    const [serverOffline, setServerOffline] = useState(false)

    const mondayInitialDate = getMondayOfCurrentWeek();
    const router = useRouter();
    // Fetch current user on load and listen for auth state change
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                // If no user or error, redirect to login page
                router.push('/login');
            } else {
                setUser(user);
            }
        };

        checkUser();
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
                // If user logs out or session expires, redirect to login
                router.push('/login');
            } else {
                setUser(session.user);
            }
        });
        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

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

        if (user) { // Only load semesters if user is authenticated
            loadSemesters();
        }
    }, [user]);

    // Manually stop autoplay when user selects a semester
    const handleManualSemesterChange = async (semester) => {
        setCurrentSemester(semester);
        await fetchEvents(semester); // Fetch new semester's events
    };

    // Fetch events when semester changes
    const fetchEvents = async (semesterId) => {

        try {
            const eventsData = await getSemester(semesterId);
            setEvents(eventsData);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    useEffect(() => {
        if (currentSemester) {
            fetchEvents(currentSemester);
        }
    }, [currentSemester]);
    // Save the Events
    const handleEventSaved = () => {
        fetchEvents(currentSemester); // Force refresh
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
                fetchEvents(currentSemester); // Force refresh
                // setEvents((prev) => [...prev.filter((e) => e.id !== id)]);
                setSelectedEvent(null);
                setShowForm(false);
            }
        };
        const handleEdit = () => {
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
                        className="absolute top-1 right-1 text-xs text-red-500 hover:text-red-700 bg-transparent px-1
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Delete"
                    >
                        ❌
                    </button>
                )}
                {user && (
                    <button
                        onClick={handleEdit}
                        className="absolute top-7 right-1 p-1 text-xs bg-transparent opacity-0 border-none outline-none hover: duration-200 group-hover:opacity-100"
                        title="Edit"
                    >
                        <PencilIcon size={15} color="#1d4ed8" />
                    </button>

                )}
                {timeText && (
                    <div className="fc-event-time text-xs font-bold text-gray-700">
                        {timeText}
                    </div>
                )}
                <div className="fc-event-title font-medium text-sm text-gray-800 text-pretty">
                    {sanitizer(title) || ''}
                </div>
                {(room || professor) && (
                    <div className="text-xs text-gray-600 flex flex-col mt-0.5">
                        {room && <span className="fc-event-room text-bred font-medium">Rm: {sanitizer(room)}</span>}
                        {professor && <span className="hidden sm:inline text-[0.975em] text-blue-800 italic">({sanitizer(professor)})</span>}
                    </div>
                )}
            </div>
        );
    };

    // Reset rescheduled events for all semesters
    const handleResetRescheduled = async () => {
        // stopAutoplay()
        const confirmed = confirm('Reset all rescheduled events?');
        if (!confirmed) {
            return;
        }
        const { error } = await resetRescheduledEvents();

        if (!error) {
            const updated = await getSemester(currentSemester);
            setEvents(updated);
            await fetchEvents(currentSemester);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            {/* if no data, disable entire page */}
            {events.length === 0 || serverOffline ? (
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
                        {showForm && (
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
                                slotMaxTime="21:50:00"
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
                                    fetchEvents(currentSemester);
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