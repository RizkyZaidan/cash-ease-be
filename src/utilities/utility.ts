import { randomBytes } from 'crypto';
import { parseISO } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';

export function randomHex32(): string {
  return randomBytes(16).toString('hex');
}

export function parseZonedTimeToUtc(dateInput: string | Date, timeZone: string): Date {
  let localDate: Date;

  if (typeof dateInput === 'string') {
    localDate = parseISO(dateInput);
  } else if (dateInput instanceof Date) {
    localDate = dateInput;
  } else {
    throw new Error('Invalid date input');
  }

  const offset = getTimezoneOffset(timeZone, localDate);
  return new Date(localDate.getTime() - offset);
}
