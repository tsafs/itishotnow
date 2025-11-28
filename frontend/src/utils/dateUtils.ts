import { DateTime } from 'luxon';

const env = import.meta.env as Record<string, string | undefined>;
const DEBUG_MODE = (env.MODE ?? 'production') === 'development';
const NOW_ENV = env.VITE_APP_NOW ?? null;
const NOW = NOW_ENV ? new Date(NOW_ENV) : null;

export const getNow = () => {
    if (DEBUG_MODE && NOW) {
        console.debug('Debug mode is enabled and VITE_APP_NOW is configured. Returning a fixed date for testing.');
        return DateTime.fromJSDate(NOW, { zone: 'Europe/Berlin' });
    }
    return DateTime.now().setZone('Europe/Berlin');
}