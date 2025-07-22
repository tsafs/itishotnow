import { DateTime } from 'luxon';

const DEBUG_MODE = process.env.NODE_ENV === 'development';
const NOW = process.env.REACT_APP_NOW ? new Date(process.env.REACT_APP_NOW) : null;

export const getNow = () => {
    if (DEBUG_MODE && NOW) {
        console.debug('Debug mode is enabled and REACT_APP_NOW is configured. Returning a fixed date for testing.');
        return DateTime.fromJSDate(NOW, { zone: 'Europe/Berlin' });
    }
    return DateTime.now().setZone('Europe/Berlin');
}