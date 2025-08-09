
export function createDateWithoutTimeZone(dateString: string): Date {
    let date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const minuteToMilliseconds = 60 * 1000;
    const dateWithoutTimeZone = new Date(date.getTime() + offset * minuteToMilliseconds)

    return dateWithoutTimeZone;
}

export function getDateTwoWeeksAgo(): string {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const yyyy = twoWeeksAgo.getFullYear();
    const mm = String(twoWeeksAgo.getMonth() + 1).padStart(2, '0');
    const dd = String(twoWeeksAgo.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function dateToZenmoneyTextFormat(date: Date): string {
    let day = date.getDate().toString().padStart(2, '0');
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let year = date.getFullYear().toString();
    return `${year}-${month}-${day}`;
}

export function toISODateString(text: string): string {
    const trimmed = text.trim();

    // If already in ISO format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }

    // If in MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const [mm, dd, yyyy] = trimmed.split('/').map(s => s.padStart(2, '0'));
        return `${yyyy}-${mm}-${dd}`;
    }

    throw new Error(`Unrecognized date format: "${text}"`);
}

const msPerDay = 1000 * 60 * 60 * 24;
export function daysDiff(a: Date, b: Date): number {
    let diffMS = Math.abs(a.getTime() - b.getTime());
    return Math.floor(diffMS / msPerDay);
}
