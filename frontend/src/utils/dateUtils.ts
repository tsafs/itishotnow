import { DateTime } from 'luxon';

const env = import.meta.env as Record<string, string | undefined>;
const DEBUG_MODE = (env.MODE ?? 'production') === 'development';
const NOW_ENV = env.VITE_APP_NOW ?? null;
const NOW = NOW_ENV ? new Date(NOW_ENV) : null;

export const getNow = () => {
    if (DEBUG_MODE && NOW) {
        return DateTime.fromJSDate(NOW, { zone: 'Europe/Berlin' });
    }
    return DateTime.now().setZone('Europe/Berlin');
}

export function extractYMD(dateString: string): { year: number; monthIndex: number; day: number } | null {
    if (!dateString) {
        return null;
    }

    if (/^\d{8}$/.test(dateString)) {
        const year = Number.parseInt(dateString.slice(0, 4), 10);
        const month = Number.parseInt(dateString.slice(4, 6), 10);
        const day = Number.parseInt(dateString.slice(6, 8), 10);

        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
            const monthIndex = month - 1;
            if (monthIndex >= 0 && monthIndex < 12 && day >= 1 && day <= 31) {
                return { year, monthIndex, day };
            }
        }
        return null;
    }

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return {
        year: parsed.getFullYear(),
        monthIndex: parsed.getMonth(),
        day: parsed.getDate(),
    };
}