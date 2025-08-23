// utils/dateUtils.js
export function getIsoStringForWeekday(weekday, time) {
  const now = new Date();
  const today = now.getDay() || 7; // Treat Sunday (0) as 7

  // Calculate offset to get the current week's weekday
  const delta = weekday - today;

  const target = new Date(now);
  target.setDate(now.getDate() + delta);

  const [hours, minutes] = time.split(":");
  target.setHours(Number(hours), Number(minutes), 0, 0);

  return target.toISOString();
}

export function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust if Sunday
  return new Date(now.setDate(diff));
}
export const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Calculate the difference to get to Monday (day 1).
  // If today is Sunday (0), we want to go back 6 days to get the previous Monday.
  // Otherwise, we go back (day - 1) days to get the current Monday.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  monday.setHours(0, 0, 0, 0); // Set to start of day for consistency
  return monday;
};

export function getCurrentWeekRange() {
  const today = new Date();

  // Get current day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = today.getDay();
  const year = today.getFullYear();

  // Calculate Monday of the current week (adjust if Sunday)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  // Calculate Sunday (end of the week)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Format: 16–22 June
  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const month = monday.toLocaleString('default', { month: 'long' });

  return `${month} ${startDay} – ${endDay}, ${year}`;
}
export const currentInterval = (time) => {
  const now = new Date();
  // const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentHour = now.getHours()
  const startH = time.split(':').map(Number)[0] - 1;
  const endH = time.split(':').map(Number)[0];

  // const startMinutes = startH * 60;
  // const endMinutes = endH * 60;
  return currentHour >= startH && currentHour < endH
  // return currentMinutes >= startMinutes && currentMinutes < endMinutes;

}
function escapeHtml(unsafe) {
  return unsafe
    // .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
  // .replace(/'/g, "&#039;");
}
export const sanitizer = (val) => {
  // Handle all empty/null values consistently at the start.
  if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
    return null;
  }

  // Process strings.
  if (typeof val === 'string') {
    const trimmedVal = val.trim();

    // Enforce the length constraint after trimming.
    if (trimmedVal.length >= 100) {
      return null;
    }

    // Handle any number of spaces and correctly convert to Title Case.
    const titleCasedVal = trimmedVal
      .split(/\s+/) // Splits by one or more spaces
      .map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');

    // *** THE SANITIZATION STEP IS ADDED HERE ***
    // We escape the string before returning to prevent XSS.
    const sanitizedVal = escapeHtml(titleCasedVal);

    return sanitizedVal;
  }

  // Process numbers.
  if (typeof val === 'number') {
    return val;
  }
  console.log(titleCasedVal)
  // Return null for any other unexpected data types.
  return null;
}
export const tableScroller = (scrollRef) => {

  const el = scrollRef.current;
  if (!el) return;

  let animationFrameId;
  let timeoutId;
  const scrollSpeed = 0.5;
  const pauseDuration = 2000;
  let isPaused = true;
  let lastTimestamp = performance.now();
  let scrollRemainder = 0;

  const fadeOut = () => {
    el.style.transition = "opacity 0.2s linear";
    el.style.opacity = "0.3";
  };

  const fadeIn = () => {
    el.style.transition = "opacity 0.2s linear";
    el.style.opacity = "1";
  };

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
        // ifwe want to scrollup instead of down
        // if (isScrollingDown) {
        //                         el.scrollTop += moveBy;
        //                         if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        //                             isPaused = true;
        //                             timeoutId = setTimeout(() => {
        //                                 isScrollingDown = false;
        //                                 isPaused = false;
        //                                 lastTimestamp = performance.now();
        //                                 requestAnimationFrame(scrollStep);
        //                             }, pauseDuration);
        //                             return;
        //                         }
        //                     } else {
        //                         el.scrollTop -= moveBy;
        //                         if (el.scrollTop <= 0) {
        //                             isPaused = true;
        //                             timeoutId = setTimeout(() => {
        //                                 isScrollingDown = true;
        //                                 isPaused = false;
        //                                 lastTimestamp = performance.now();
        //                                 requestAnimationFrame(scrollStep);
        //                             }, pauseDuration);
        //                             return;
        //                         }
        //                     }
        el.scrollTop += moveBy;

        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          isPaused = true;
          timeoutId = setTimeout(() => {
            fadeOut();
            setTimeout(() => {
              el.scrollTop = 0; // jump
              fadeIn();
              setTimeout(() => {
                isPaused = false;
                lastTimestamp = performance.now();
                requestAnimationFrame(scrollStep);
              }, pauseDuration);
            }, 250); // quick fade-out
          }, pauseDuration);
          return;
        }

      }
    }

    animationFrameId = requestAnimationFrame(scrollStep);
  };

  // initial start after pause
  timeoutId = setTimeout(() => {
    isPaused = false;
    lastTimestamp = performance.now();
    requestAnimationFrame(scrollStep);
  }, pauseDuration);

  return () => {
    cancelAnimationFrame(animationFrameId);
    clearTimeout(timeoutId);
  };

}
export const normalizeTime = (t) => {
  if (!t) return "";
  let [h, m] = t.split(":");
  return `${h.padStart(2, "0")}:${m}`;
}
