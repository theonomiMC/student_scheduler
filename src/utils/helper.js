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

console.log(getCurrentWeekRange());
