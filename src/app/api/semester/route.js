// app/api/semester/route.js
import { supabase } from '@/lib/supabaseClient';
import { getIsoStringForWeekday } from '@/utils/helper';

export async function getSemester(num) {
  const { data, error } = await supabase.from('schedule').select('*').eq('semester',num);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return data.map(event=>({
    id:event.id,
    title:event.title,
    start:getIsoStringForWeekday(event.day_of_week, event.start),
    end:getIsoStringForWeekday(event.day_of_week, event.end),
    extendedProps:{
      professor:event.professor,
      room:event.room,
      status:event.status,
      rescheduled:event.rescheduled
    }
  }));
}

export const handleEventDrop = async (info) => {
  const event = info.event;
  const rescheduled = confirm('Is this a rescheduled class?');
  // Format values for Supabase
  const updated = {
    start: event.start.toTimeString().slice(0, 5), // "HH:MM"
    end: event.end.toTimeString().slice(0, 5),
    day_of_week: event.start.getDay() === 0 ? 7 : event.start.getDay(), // Sunday as 7
    rescheduled
  };

  // Call Supabase update
  const { data, error } = await supabase
    .from('schedule') // ✅ Make sure this matches your table name
    .update(updated)
    .eq('id', event.id)
    .select();

  if (error) {
    console.error('Update failed:', error.message);
    info.revert(); // revert drag if update fails
    alert('Failed to update schedule.');
  } else {
    console.log('Update successful:', data);
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

  console.log('Event inserted successfully:', data);
  return { data };
}

export async function resetRescheduledEvents() {
  const { data, error } = await supabase
    .from('schedule')
    .update({ rescheduled: false })
    .eq('rescheduled', true);

  if (error) {
    console.error('Reset error:', error.message);
    return { error };
  }

  console.log('Rescheduled events reset.');
  return { data };
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
