import { useState, useEffect } from 'react';
import { currentInterval } from './helper';

const times = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00','19:00', '20:00'
];


export function useCurrentTimeSlot() {
  const [currentSlot, setCurrentSlot] = useState(null);

  useEffect(() => {
    function updateSlot() {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const slot = times.find(time => currentInterval(time));

      setCurrentSlot(slot || null);
      const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      timeoutId = setTimeout(updateSlot, msUntilNextMinute);
    }

    let timeoutId;
    updateSlot();

    return () => clearTimeout(timeoutId);
  }, []);

  return currentSlot;
}
