export function formatDistanceToNow(date: Date, options?: { includeSeconds?: boolean }): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // selisih dalam detik

  if (diff < 60) {
    return `${diff} detik lalu`;
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} menit lalu`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} jam lalu`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} hari lalu`;
  } else if (options?.includeSeconds) {
    const weeks = Math.floor(diff / 604800);
    return `${weeks} minggu lalu`;
  } else {
    return formatDate(date);
  }
}

export function formatDate(date: Date): string {
  const day = date.getDate();
  const month = getMonthName(date.getMonth());
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export function getMonthName(monthIndex: number): string {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  return monthNames[monthIndex];
}

export function isWithinOneWeek(date: Date): boolean {
  const now = new Date();
  const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  return date > oneWeekAgo;
}

export function isWithinOneMonth(date: Date): boolean {
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return date > oneMonthAgo;
}