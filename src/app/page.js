'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAllData } from './api/semester/route';
import Loader from './components/loader';
import { getCurrentWeekRange } from '@/utils/helper';
import './calendar.css';
import './globals.css';


const times = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00'
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomePage() {
  const [eventsByDay, setEventsByDay] = useState({});
  const [serverOffline, setServerOffline] = useState(false);

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

  // Effect to update the current time line position
  // useEffect(() => {
  //   let animationFrameId;
  //   const updateCurrentTimeLine = () => {
  //     setCurrentTimePos(getCurrentTimeLinePosition());
  //     animationFrameId = requestAnimationFrame(updateCurrentTimeLine);
  //   };
  //   updateCurrentTimeLine();
  //   return () => cancelAnimationFrame(animationFrameId);
  // }, []);

  // --- Smooth Auto-Scroll with requestAnimationFrame ---
  useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;

  let animationFrameId;
  let timeoutId;
  let isScrollingDown = true;
  const scrollSpeed = 0.5; // შეგიძლია 0.05 ან ნაკლებიც
  const pauseDuration = 2000;
  let isPaused = true; // დავიწყოთ დაპაუზებული
  let lastTimestamp = performance.now();
  let scrollRemainder = 0;

  const scrollStep = (timestamp) => {
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    if (!el) return;

    if (!isPaused) {
      const pixelChange = scrollSpeed * (deltaTime / 16); // approx. 60fps
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
    const min = date.getMinutes();
    const slot = `${String(hour).padStart(2, '0')}:${min < 30 ? '00' : '30'}`;
    return times.indexOf(slot);
  };

  const getEventSpan = (start, end) => {
    const startIdx = getTimeIndex(start);
    const endIdx = getTimeIndex(end);
    return {
      startIdx,
      duration: Math.max(endIdx - startIdx, 0.5) // Ensure at least half-cell width
    };
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
  const getCurrentTimeLinePosition = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;

    const index = times.findIndex((t, i) => {
      const [h, m] = t.split(':').map(Number);
      const slotMin = h * 60 + m;
      return totalMinutes >= slotMin && totalMinutes < slotMin + 30;
    });

    if (index === -1) return null;

    const [startH, startM] = times[index].split(':').map(Number);
    const slotStart = startH * 60 + startM;
    const percent = ((totalMinutes - slotStart) / 30) * 100;

    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()].slice(0, 3);

    return { day, index, offsetPercent: percent };
  };
  const [currentTimePos, setCurrentTimePos] = useState(getCurrentTimeLinePosition());

  const createTimeSlotRows = (day, idx) => {
    const dayEvents = getEventsByDay(day);
    const timeLine = getCurrentTimeLinePosition();
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
          {times.map((_, i) => (
            <td key={i} className="relative border px-1 py-1">
              {currentTimePos &&
                currentTimePos.day === day &&
                currentTimePos.index === i && (
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-red-500 z-10"
                    style={{ top: `${currentTimePos.offsetPercent}%` }}
                  />
                )}
            </td>
          ))}
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
            <div className={`p-1 rounded shadow text-[10px] ${event.extendedProps.rescheduled ? 'bg-brand-yellow border-yellow-200' : 'bg-white border-blue-200'} border`}>
              <div className="font-semibold text-blue-900">{event.title}</div>
              <div className="text-gray-700">{event.shortTime} <span className="text-gray-500 text-[9px]">({event.dayOfWeek})</span></div>
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
                ${isCurrentDay ? 'border-red-500 border-l-2 border-r-2 bg-white text-red-700'
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
      <h2 className="text-center text-lg font-bold text-blue-900 mb-4"> {getCurrentWeekRange()} (Weekly Schedule)</h2>
      <div className="max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden" ref={scrollRef}>
        <table className="w-full border-collapse text-[10px] table-fixed ">
          <thead className="sticky top-0 bg-gray-100 z-20">
            <tr>
              <th className="sticky left-0 border px-2 py-1 text-left w-[35px]">Day</th>
              {times.map(time => (
                <th key={time} className="border px-2 py-1 text-center">{time}</th>
              ))}
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