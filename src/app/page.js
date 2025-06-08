'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  getAllSemesters,
} from './api/semester/route';
import { getMondayOfCurrentWeek } from '@/utils/helper';
import Loader from './components/loader';
import './calendar.css';
import './globals.css';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

export default function HomePage() {
  const [semesters, setSemesters] = useState([]);
  const [events, setEvents] = useState([])
  const [serverOffline, setServerOffline] = useState(false);

  const sectionsRef = useRef([]);
  const autoplayIndexRef = useRef(0);
  const autoplayIntervalRef = useRef(null);

  const mondayInitialDate = getMondayOfCurrentWeek();

  const fetchSemesters = useCallback(async () => {
    try {
      const grouped = await getAllSemesters();
      setEvents(grouped)
      setSemesters(Object.keys(grouped).sort());
      setServerOffline(false);
    } catch (err) {
      console.error('Failed to fetch semesters:', err);
      setServerOffline(true);
    }
  }, []);

  useEffect(() => {
    fetchSemesters();
    // ✅ Subscribe to Supabase Realtime changes
    const channel = supabase
      .channel('calendar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule' },
        (payload) => {

          fetchSemesters();
        }
      )
      .subscribe();

    // 🧹 Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
    // const interval = setInterval(fetchSemesters, 1* 60 * 1000);
    // return () => clearInterval(interval);
  }, [fetchSemesters]);

  // auto play semesters
  useEffect(() => {
    if (semesters.length === 0) return;

    autoplayIntervalRef.current = setInterval(() => {
      const idx = autoplayIndexRef.current;
      const nextIdx = (idx + 1) % semesters.length;
      const nextSection = sectionsRef.current[nextIdx];
      if (nextSection) {
        nextSection.scrollIntoView({
          behavior: 'smooth'
        });
      }
      autoplayIndexRef.current = nextIdx;
    }, 4000);

    return () => clearInterval(autoplayIntervalRef.current);
  }, [semesters]);


  const renderEventContent = (eventInfo) => {
    const { timeText, event } = eventInfo;
    if (!event) return null;

    const { id, title, extendedProps } = event;
    const { room, professor, rescheduled } = extendedProps || {};

    return (
      <div
        className={`fc-event-custom-content relative group rounded-md shadow-sm transition sm:text-sm text-[10px] ${rescheduled ? 'bg-brand-yellow pt-[3px]' : 'bg-white'}`}
      >

        <div className="fc-event-time font-bold text-xs">{timeText}</div>
        <div className="fc-event-title font-medium text-sm">{title}</div>
        <div className="text-xs text-gray-600">
          {room && <div className="text-blue-900 font-medium">Rm: {room}</div>}
          {professor && <div className="text-blue-800 italic">({professor})</div>}
        </div>
      </div>
    );
  };

  if (serverOffline || semesters.length === 0) {
    return <Loader message={serverOffline ? 'Server offline. Reconnecting…' : 'Loading schedule…'} />;
  }
  // console.log(semesters)
  return (
    <div className="full-page-container">
      {semesters.map((semester, idx) => {
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
        return (

          <div
            key={semester}
            ref={el => (sectionsRef.current[idx] = el)}
            className="semester-section bg-gray-50 px-2"
          >
            <div className="text-center pt-4 font-bold text-lg
           text-blue-950 font-sans">
              Semester {romanNumerals[semester - 1]}
            </div>
            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin]}
              initialDate={mondayInitialDate}
              initialView="timeGridWeek"
              slotMinTime="09:00:00"
              slotMaxTime="18:50:00"
              height="calc(100vh - 80px)"
              // height='auto'
              expandRows={true}
              allDaySlot={false}
              hiddenDays={[0]}
              timeZone="local"
              nowIndicator={true}
              eventContent={renderEventContent}
              events={events[semester] || []}
              headerToolbar={{
                left: '',
                center: 'title',
                right: '',
              }}
            />
          </div>
        )
      })}
    </div>
  );
}
