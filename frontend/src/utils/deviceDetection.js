/**
 * Get the device type based on screen width
 * This function considers multiple width properties to handle browser device simulation properly
 * @returns {string} 'small', 'medium', 'large', or 'desktop'
 */
export const getDeviceType = () => {
    // Get width using multiple properties to handle browser simulation
    const width = Math.min(
        window.innerWidth,
        document.documentElement.clientWidth || Infinity,
        window.screen.width || Infinity
    );

    // Use more inclusive breakpoints for mobile detection
    if (width <= 480) return 'small';
    if (width <= 768) return 'medium';
    if (width <= 1024) return 'large';
    return 'desktop';
};
