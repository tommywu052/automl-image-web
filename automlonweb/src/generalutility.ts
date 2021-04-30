export function getTimeString(): string {
    let timeNow = new Date();
    let isoTimeString = timeNow.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    return 'UTC: ' + isoTimeString
}

export function toNumber(str: string) {
    let tempstr = String(str).trim();
    return !tempstr ? NaN : Number(tempstr);
}

export function stringIsBlank(str: string | undefined) {
    return (!str || /^\s*$/.test(str));
}