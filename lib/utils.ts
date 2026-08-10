import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to Russian format (e.g., "23 мая 2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Attempts to parse a custom date string into a Date object
 * Supports formats like "23 мая 2025", "23.05.2025", "23/05/2025", etc.
 */
export function parseCustomDate(dateString: string): Date | null {
  if (!dateString) return null

  // Try to parse using built-in Date parser first
  const date = new Date(dateString)
  if (!isNaN(date.getTime())) {
    return date
  }

  // Try to parse Russian format like "23 мая 2025"
  const russianMonths: Record<string, number> = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11,
  }

  const russianPattern = /(\d{1,2})\s+([а-яА-Я]+)\s+(\d{4})/
  const match = dateString.match(russianPattern)

  if (match) {
    const day = Number.parseInt(match[1], 10)
    const monthName = match[2].toLowerCase()
    const year = Number.parseInt(match[3], 10)

    if (russianMonths[monthName] !== undefined) {
      return new Date(year, russianMonths[monthName], day)
    }
  }

  // Try to parse common formats like DD.MM.YYYY or DD/MM/YYYY
  const commonPattern = /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/
  const commonMatch = dateString.match(commonPattern)

  if (commonMatch) {
    const day = Number.parseInt(commonMatch[1], 10)
    const month = Number.parseInt(commonMatch[2], 10) - 1 // Months are 0-indexed in JS
    const year = Number.parseInt(commonMatch[3], 10)

    return new Date(year, month, day)
  }

  return null
}

/**
 * Attempts to parse a custom time string into a time format
 * Supports formats like "18:30", "18.30", "6:30 PM", etc.
 */
export function parseCustomTime(timeString: string): string | null {
  if (!timeString) return null

  // Check if it's already in HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    return timeString
  }

  // Try to parse time with period like "6:30 PM"
  const periodPattern = /(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i
  const periodMatch = timeString.match(periodPattern)

  if (periodMatch) {
    let hours = Number.parseInt(periodMatch[1], 10)
    const minutes = periodMatch[2]
    const period = periodMatch[3]?.toUpperCase()

    if (period === "PM" && hours < 12) {
      hours += 12
    } else if (period === "AM" && hours === 12) {
      hours = 0
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}`
  }

  // Try to parse time with dot separator like "18.30"
  const dotPattern = /(\d{1,2})[.](\d{2})/
  const dotMatch = timeString.match(dotPattern)

  if (dotMatch) {
    const hours = Number.parseInt(dotMatch[1], 10)
    const minutes = dotMatch[2]

    return `${hours.toString().padStart(2, "0")}:${minutes}`
  }

  return null
}
