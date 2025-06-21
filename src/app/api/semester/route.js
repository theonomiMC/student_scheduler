import { supabase } from '@/lib/supabaseClient';
import { getIsoStringForWeekday } from '@/utils/helper';

export async function getAllData(num) {
  const { data, error } = await supabase.from('schedule').select('*');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return data.filter(event => event.start && event.end).map(event => ({
    id: event.id,
    title: event?.title,
    start: getIsoStringForWeekday(event?.day_of_week, event?.start),
    end: getIsoStringForWeekday(event?.day_of_week, event?.end),
    extendedProps: {
      professor: event.professor,
      room: event.room,
      semester: event.semester,
      // status: event.status,
      semester: event.semester,
      rescheduled: event.rescheduled
    }
  }));
}

export async function getSemester(num) {
  const { data, error } = await supabase.from('schedule').select('*').eq('semester', num);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return data.filter(event => event.start && event.end).map(event => ({
    id: event.id,
    title: event?.title,
    start: getIsoStringForWeekday(event?.day_of_week, event?.start),
    end: getIsoStringForWeekday(event?.day_of_week, event?.end),
    extendedProps: {
      professor: event.professor,
      room: event.room,
      // status: event.status,
      semester: event.semester,
      rescheduled: event.rescheduled
    }
  }));
}
export async function getAllSemesters() {
  const { data, error } = await supabase.from('schedule').select('*');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const grouped = {};

  data
    .filter(event => event.start && event.end)
    .forEach(event => {
      const semester = event.semester;

      const mappedEvent = {
        id: event.id,
        title: event?.title,
        start: getIsoStringForWeekday(event?.day_of_week, event?.start),
        end: getIsoStringForWeekday(event?.day_of_week, event?.end),
        extendedProps: {
          professor: event.professor,
          room: event.room,
          status: event.status,
          semester: event.semester,
          rescheduled: event.rescheduled,
        },
      };

      if (!grouped[semester]) grouped[semester] = [];
      grouped[semester].push(mappedEvent);
    });

  return grouped;
}

export const handleEventDrop = async (info) => {
  const event = info.event;
  const oldEvent = info.oldEvent
  const rescheduled = confirm('Reschedule this class?');

  // Format values for Supabase
  const updated = {
    start: event?.start ? event.start.toTimeString().slice(0, 5) : null,
    end: event?.start ? event.end.toTimeString().slice(0, 5) : null,
    day_of_week: event?.start ? (event.start.getDay() === 0 ? 7 : event.start.getDay()) : null,
    semester: event?.extendedProps.semester,
    rs_start: oldEvent?.start.toTimeString().slice(0, 5) || null,
    rs_end: oldEvent?.end.toTimeString().slice(0, 5) || null,
    rs_day: oldEvent?.start.getDay() === 0 ? 7 : oldEvent.start.getDay() || null,
    rs_room: oldEvent?.extendedProps?.room || null,
    rescheduled
  };
  // Call Supabase update
  const { data, error } = await supabase
    .from('schedule')
    .update(updated)
    .eq('id', event.id)
    .select();

  if (error) {
    console.error('Update failed:', error.message);
    info.revert();
    alert('Failed to update schedule.');
  } else {
    console.log('Updated successful');
  }
};

export async function insertEvent(newEvent) {
  const { data, error } = await supabase
    .from('schedule')
    .insert([newEvent]);

  if (error) {
    console.error('Insert error:', error.message);
    return { error };
  }

  console.log('Event inserted successfully');
  return { data };
}

export async function resetRescheduledEvents() {
  const { data: events, error: fetchError } = await supabase
    .from('schedule')
    .select('id, rs_start, rs_end, rs_day, rs_room')
    .eq('rescheduled', true);

  if (fetchError) {
    console.error('Fetch error:', fetchError.message);
    return { error: fetchError };
  }

  for (const event of events) {
    const { id, rs_start, rs_end, rs_day, rs_room } = event;

    const { error: updateError } = await supabase
      .from('schedule')
      .update({
        start: rs_start,
        end: rs_end,
        day_of_week: rs_day,
        room: rs_room,
        rescheduled: false
      })
      .eq('id', id);

    if (updateError) {
      console.error(`Update failed for ID ${id}:`, updateError.message);
    }
  }

  console.log('Rescheduled events reset.');
  return { success: true };
}



export async function deleteEvent(id) {
  const { data, error } = await supabase
    .from('schedule')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error.message);
    return { error };
  }

  console.log('Event deleted!', data);
  return { data };
}
export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('schedule')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);
  return data;
}
