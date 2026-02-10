/**
 * Safely converts a Firestore Timestamp or a serialized timestamp object to a Date.
 * @param timestamp The value to convert.
 * @returns A Date object, or a zero-date if conversion fails.
 */
export function toDate(timestamp: any): Date {
    if (!timestamp) return new Date(0);
    // Standard Firebase Timestamp object
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    // Serialized Timestamp (e.g., from server-side rendering or API)
    if (timestamp && typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000);
    }
    // Fallback for unexpected formats (e.g., ISO string)
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
        return d;
    }
    // Return a default invalid date if all else fails
    return new Date(0);
}
