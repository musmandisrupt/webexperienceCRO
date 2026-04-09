import { format } from 'date-fns'

/**
 * Safely formats a date value, handling both Date objects and date strings
 * @param dateValue - The date to format (Date object, string, or undefined)
 * @param formatString - The format string to use (e.g., 'MMM d, yyyy')
 * @param fallback - Fallback text if date is invalid (default: 'Unknown')
 * @returns Formatted date string or fallback text
 */
export const safeFormatDate = (
  dateValue: Date | string | undefined, 
  formatString: string, 
  fallback: string = 'Unknown'
): string => {
  if (!dateValue) return fallback
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue, 'Type:', typeof dateValue)
      return fallback
    }
    
    return format(date, formatString)
  } catch (error) {
    console.error('Error formatting date:', error, dateValue)
    return fallback
  }
}

/**
 * Safely converts a date value to a Date object
 * @param dateValue - The date to convert (Date object, string, or undefined)
 * @returns Date object or null if invalid
 */
export const safeParseDate = (dateValue: Date | string | undefined): Date | null => {
  if (!dateValue) return null
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue, 'Type:', typeof dateValue)
      return null
    }
    
    return date
  } catch (error) {
    console.error('Error parsing date:', error, dateValue)
    return null
  }
}

/**
 * Safely formats a date for display using toLocaleDateString
 * @param dateValue - The date to format (Date object, string, or undefined)
 * @param options - Locale options for date formatting
 * @param fallback - Fallback text if date is invalid (default: 'Unknown')
 * @returns Formatted date string or fallback text
 */
export const safeLocaleDateString = (
  dateValue: Date | string | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'Unknown'
): string => {
  if (!dateValue) return fallback
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue, 'Type:', typeof dateValue)
      return fallback
    }
    
    return date.toLocaleDateString(undefined, options)
  } catch (error) {
    console.error('Error formatting date:', error, dateValue)
    return fallback
  }
}
