export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatTime(value: string): string {
  return value.substring(0, value.length - 3);
}

export function formatDate(value: number): string {
  const date = new Date(value * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function getCurrentUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function normalizeTimeForBackend(value: string): string {
  const time = value.includes('T') ? value.split('T')[1] : value;
  const cleanTime = time.replace('Z', '').split('.')[0];
  const [hours = '00', minutes = '00', seconds] = cleanTime.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds?.padStart(2, '0') ?? '00'}`;
}

export function unixTimestampToDateValue(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateForBackend(value: string): number {
  const dateValue = value.split('T')[0];
  const [year, month, day] = dateValue.split('-').map(Number);
  return Math.floor(new Date(year, month - 1, day, 0, 0, 0, 0).getTime() / 1000);
}

export function timeToSeconds(time: string | null | undefined): number {
  if (!time) {
    return 0;
  }

  const [hours = '0', minutes = '0', seconds = '0'] = time.split(':');

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}
