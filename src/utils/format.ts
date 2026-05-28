import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

// Pastikan tanggal selalu dikonversi ke local timezone dari browser user
export function formatDistanceToNow(date: Date | string): string {
  // Jika database mengembalikan string T...Z, tapi itu sebenarnya adalah waktu WIB (GMT+7) tanpa time zone, 
  // kita perlu membuang karakter 'Z' terakhir sebelum parsing, atau menganggapnya lokal.
  // Jika database sudah merekam secara benar sebagai true UTC, dayjs(date) sudah otomatis konversi ke local timezone.
  return dayjs.utc(date).local().fromNow();
}

export function formatDate(date: Date | string): string {
  return dayjs.utc(date).local().format("D MMM YYYY");
}

export function formatDateTime(date: Date | string): string {
  return dayjs.utc(date).local().format("D MMM YYYY, HH:mm");
}

export function isWithinOneWeek(date: Date | string): boolean {
  return dayjs().diff(dayjs.utc(date).local(), 'day') <= 7;
}

export function isWithinOneMonth(date: Date | string): boolean {
  return dayjs().diff(dayjs.utc(date).local(), "month") === 0;
}

export function getSmartDate(date: Date | string): string {
  if (isWithinOneWeek(date)) return formatDistanceToNow(date);
  return formatDate(date);
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}
