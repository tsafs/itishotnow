const DEBUG_MODE = process.env.NODE_ENV === 'development';

export const getNow = () => {
    if (DEBUG_MODE) {
        console.log('Debug mode is enabled. Returning a fixed date for testing.');
        return new Date('2025-07-07T17:35:00Z');
    }
    return new Date();
}