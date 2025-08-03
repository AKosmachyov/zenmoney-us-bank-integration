
export function createDateWithoutTimeZone(dateString: string): Date {
    let date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const minuteToMilliseconds = 60 * 1000;
    const dateWithoutTimeZone = new Date(date.getTime() + offset * minuteToMilliseconds)

    return dateWithoutTimeZone;
}

export function getDateTwoWeeksAgo(date: Date): Date {
    const twoWeeksAgo = new Date(date);
    twoWeeksAgo.setDate(date.getDate() - 14);

    return twoWeeksAgo;
}

export function dateToZenmoneyTextFormat(date: Date): string {
    let day = date.getDate().toString().padStart(2, '0');
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let year = date.getFullYear().toString();
    return `${year}-${month}-${day}`;
}

export function toISODateString(text: string): string {
    const [mm, dd, yyyy] = text.split('/').map(s => s.padStart(2, '0'));
    return `${yyyy}-${mm}-${dd}`;
}

const msPerDay = 1000 * 60 * 60 * 24;
export function daysDiff(a: Date, b: Date): number {
    let diffMS = Math.abs(a.getTime() - b.getTime());
    return Math.floor(diffMS / msPerDay);
}
