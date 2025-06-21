'use client';

import React, { useEffect, useState, useCallback, useRef, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAllData } from './api/semester/route';
import Loader from './components/loader';
import { getCurrentWeekRange } from '@/utils/helper';
import { useCurrentTimeSlot } from '@/utils/useCurrentTimeSlot';
import { times, days } from '@/utils/constants';
import './calendar.css';
import './globals.css';


export default function HomePage() {
  const [eventsByDay, setEventsByDay] = useState({});
  const [serverOffline, setServerOffline] = useState(false);
  const currentSlot = useCurrentTimeSlot();

  const scrollRef = useRef(null);
  // Function to group events by day
  // This function takes the fetched data and organizes it by day of the week.
  const groupEventsByDay = (data) => {
    // const allEvents = Object.values(data).flat();
    const eventsByDay = {};
    data.forEach(ev => {
      const startDate = new Date(ev.start);
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][startDate.getDay()].slice(0, 3);
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    });

    return eventsByDay;
  };
  // Fetch semesters and group events by day
  const fetchEvents = useCallback(async () => {
    try {
      const grouped = await getAllData();
      const byDay = groupEventsByDay(grouped);
      setEventsByDay(byDay);
      setServerOffline(false);
    } catch (err) {
      console.error('Failed to fetch semesters:', err);
      setServerOffline(true);
    }
  }, []);
  // Fetch events on mount and subscribe to changes
  // This will keep the schedule updated in real-time.
  useEffect(() => {
    fetchEvents();
    // Subscribe to changes in the 'schedule' table
    const channel = supabase
      .channel('calendar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule' },
        () => fetchEvents()
      )
      .subscribe();
    return () => channel.unsubscribe();
  }, [fetchEvents]);

  // --- Smooth Auto-Scroll with requestAnimationFrame ---
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId;
    let timeoutId;
    let isScrollingDown = true;
    const scrollSpeed = 0.5;
    const pauseDuration = 2000;
    let isPaused = true;
    let lastTimestamp = performance.now();
    let scrollRemainder = 0;

    const scrollStep = (timestamp) => {
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      if (!el) return;

      if (!isPaused) {
        const pixelChange = scrollSpeed * (deltaTime / 16);
        scrollRemainder += pixelChange;

        if (scrollRemainder >= 1) {
          const moveBy = Math.floor(scrollRemainder);
          scrollRemainder -= moveBy;

          if (isScrollingDown) {
            el.scrollTop += moveBy;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
              isPaused = true;
              timeoutId = setTimeout(() => {
                isScrollingDown = false;
                isPaused = false;
                lastTimestamp = performance.now();
                requestAnimationFrame(scrollStep);
              }, pauseDuration);
              return;
            }
          } else {
            el.scrollTop -= moveBy;
            if (el.scrollTop <= 0) {
              isPaused = true;
              timeoutId = setTimeout(() => {
                isScrollingDown = true;
                isPaused = false;
                lastTimestamp = performance.now();
                requestAnimationFrame(scrollStep);
              }, pauseDuration);
              return;
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(scrollStep);
    };

    // Start after initial pause
    timeoutId = setTimeout(() => {
      isPaused = false;
      lastTimestamp = performance.now();
      requestAnimationFrame(scrollStep);
    }, pauseDuration);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [Object.keys(eventsByDay).length]);


  const getTimeIndex = (date) => {
  const hour = date.getHours();
  return times.indexOf(`${String(hour).padStart(2, '0')}:00`);
};

const getEventSpan = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const endHour = endDate.getHours();
  const endMinutes = endDate.getMinutes();

  const startIdx = getTimeIndex(startDate);

  let duration =
    (endHour * 60 + endMinutes - (startHour * 60 + startMinutes)) / 60;

  duration = Math.max(duration, 0.5);

  return { startIdx, duration };
};


  const getEventsByDay = (day) => {
    const dayEvents = eventsByDay[day] || [];
    return dayEvents
      .map(ev => {
        const startDate = new Date(ev.start);
        const endDate = new Date(ev.end);
        const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][startDate.getDay()].slice(0, 3);
        if (weekday !== day) return null;
        const { startIdx, duration } = getEventSpan(startDate, endDate);
        if (startIdx === -1 || duration <= 0) return null;
        return {
          ...ev,
          startIdx,
          duration,
          shortTime: `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          dayOfWeek: weekday
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.startIdx - b.startIdx);
  };

  function groupOverlappingEvents(events) {
    const layers = [];
    events.forEach(event => {
      let placed = false;
      for (const layer of layers) {
        const lastEvent = layer[layer.length - 1];
        const lastEnd = lastEvent.startIdx + lastEvent.duration;
        if (event.startIdx >= lastEnd) {
          layer.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) layers.push([event]);
    });
    return layers;
  }

  const createTimeSlotRows = (day, idx) => {
    const dayEvents = getEventsByDay(day);
    
    const isToday = () => {
      const today = new Date();
      const todayDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()].slice(0, 3);
      return todayDay;
    };
    const todayShort = isToday();
    const isCurrentDay = day === todayShort;

    if (dayEvents.length === 0) {
      return [
        <tr key={`${day}_empty`} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
          <td className="border px-1 py-1 font-bold text-xs text-blue-800 sticky left-0 bg-white z-10 whitespace-nowrap">{day}</td>
        </tr>
      ];
    }
    const layers = groupOverlappingEvents(dayEvents);
    return layers.map((layer, layerIdx) => {
      const row = [];
      const occupied = Array(times.length).fill(false);
      for (let i = 0; i < times.length; i++) {
        if (occupied[i]) continue;
        const event = layer.find(e => e.startIdx === i);
        if (!event) {
          row.push(<td key={`empty_${i}_${layerIdx}`} className="border px-1 py-1"></td>);
          continue;
        }
        row.push(
          <td
            key={`${event.title}_${i}_${layerIdx}`}
            className="border px-1 py-1 align-top"
            colSpan={event.duration}
          >
            <div className={`p-2 rounded shadow-md text-xs ${event.extendedProps.rescheduled ? 'bg-brand-yellow border-yellow-200' : 'bg-white border-gray-300'} border`}>
              <div className="font-semibold text-blue-900">{event.title}</div>
              <div className="text-gray-700">{event.shortTime} <span className="text-xs">({event.dayOfWeek})</span></div>
              {event.extendedProps?.room && <div className="text-red-700">Rm: {event.extendedProps.room}</div>}
              {event.extendedProps?.professor && <div className="italic text-gray-600">{event.extendedProps.professor}</div>}
            </div>
          </td>
        );
        for (let j = 0; j < event.duration; j++) {
          if (i + j < times.length) occupied[i + j] = true;
        }
      }
      return (
        <tr key={`${day}_row_${layerIdx}`} className={idx % 2 === 0 ? 'bg-gray-50' :
          'bg-white'}>
          {layerIdx === 0 ? (
            <td
              rowSpan={layers.length}
              className={`px-1 py-1 font-bold text-xs sticky left-0 z-10 
                whitespace-nowrap align-middle 
                ${isCurrentDay ? 'border-red-500 border-r-2 bg-white text-red-700'
                  : idx % 2 === 0 ? 'bg-gray-50 text-blue-800' :
                    'border-blue-100 bg-white text-blue-800'}`}
            >
              {day}
            </td>
          ) : null}
          {row}
        </tr>
      );
    });
  };

  if (serverOffline || Object.keys(eventsByDay).length === 0) {
    return <Loader message={serverOffline ? 'Server offline. Reconnecting…' : 'Loading schedule…'} />;
  }

  return (
    <div className="p-4 bg-white min-h-screen flex flex-col">
      <h2 className="text-center text-lg font-bold text-blue-900 mb-4 font-mono"> {getCurrentWeekRange()} (Weekly Schedule)</h2>
      <div className="max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden" ref={scrollRef}>
        <table className="w-full border-separate border-spacing-0 text-xs table-fixed ">
          <thead className="sticky top-0 bg-gray-100 z-20">
            <tr>
              <th className="sticky left-0 px-2 py-1  w-[35px]">Day</th>
              {times.map(time => (
                <th key={time} className={`px-2 py-1 border-r-[1px] text-right ${currentSlot === time ? 'border-b-2 border-red-500' : 'border-gray'}`}>{time}</th>
              )
              )}
            </tr>
          </thead>
          <tbody>
            {days.flatMap((day, idx) => createTimeSlotRows(day, idx))}
          </tbody>
        </table>
      </div>
    </div>
  );
}