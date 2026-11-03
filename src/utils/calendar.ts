import { EventItem } from '../types/ward';

/**
 * Generates and triggers download of an iCalendar (.ics) file.
 */
export function downloadEventIcs(event: EventItem): void {
  // Parse date and time if available
  // Expecting event.date in YYYY-MM-DD format
  const dateStr = event.date.replace(/-/g, '');
  const startTimeClean = event.startTime ? event.startTime.replace(/[^0-9]/g, '') : '0900';
  const startHourMin = (startTimeClean + '0000').slice(0, 4);

  const dtStart = `${dateStr}T${startHourMin}00`;
  // Default 2 hours later for end time
  const dtEnd = `${dateStr}T${(parseInt(startHourMin.slice(0, 2), 10) + 2).toString().padStart(2, '0')}${startHourMin.slice(2, 4)}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ente Ward 19 Melparamba//Citizen Portal//ML',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.venue}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.slice(0, 30).replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates Google Calendar URL to directly add the event.
 */
export function getGoogleCalendarUrl(event: EventItem): string {
  const dateStr = event.date.replace(/-/g, '');
  const startTimeClean = event.startTime ? event.startTime.replace(/[^0-9]/g, '') : '0900';
  const startHourMin = (startTimeClean + '0000').slice(0, 4);
  const endHour = (parseInt(startHourMin.slice(0, 2), 10) + 2).toString().padStart(2, '0');
  const dates = `${dateStr}T${startHourMin}00/${dateStr}T${endHour}${startHourMin.slice(2, 4)}00`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: dates,
    details: `${event.description}\n\nവാർഡ് 19 മേൽപ്പറമ്പ`,
    location: event.venue,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
