export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function length(x, y) {
    return Math.sqrt(x * x + y * y);
}
export function normalize(x, y) {
    const len = length(x, y);
    if (!len)
        return [0, 0];
    return [x / len, y / len];
}
export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}
export function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
export function normalizeSlug(name = '') {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
export function normalizeIdentifier(value = '') {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
}
