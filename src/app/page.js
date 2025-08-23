'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAllData } from './api/semester/route';
import ScheduleSkeleton from './components/ScheduleSkeleton';
import ScheduleTable from './components/ScheduleTable';
import { useCurrentTimeSlot } from '@/utils/useCurrentTimeSlot';
import './calendar.css';
import './globals.css';



export default function HomePage() {
  const [eventsByDay, setEventsByDay] = useState({});
  const [serverOffline, setServerOffline] = useState(false);
  
  const currentSlot = useCurrentTimeSlot();
// Function to group events by day of the week
  const groupEventsByDay = (data) => {
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
    let idleCallbackId;
    const handleIdle = () => {

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
      // unsubscribe when unmounted
      return () => channel.unsubscribe();
    }
    if ('requestIdleCallback' in window) {
      idleCallbackId = requestIdleCallback(handleIdle, { timeout: 2000 });

    } else {
      // fallback for older browsers
      setTimeout(handleIdle, 200);
    }
    return () => {
      if ('cancelIdleCallback' in window && idleCallbackId) {
        cancelIdleCallback(idleCallbackId);
      }
    };
  }, [fetchEvents]);

  return (
    <>
      {serverOffline || Object.keys(eventsByDay).length === 0 ? (
        <ScheduleSkeleton />
      ) : (
        <ScheduleTable
          eventsByDay={eventsByDay}
          currentSlot={currentSlot}
        />
      )}
    </>
  );
}