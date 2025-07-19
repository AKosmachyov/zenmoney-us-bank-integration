
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
