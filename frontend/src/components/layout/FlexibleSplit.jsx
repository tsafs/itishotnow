import React from 'react';

/**
 * FlexibleSplit: A layout component supporting left-right or top-down arrangement,
 * with optional scrollable diagram area. Uses TailwindCSS only.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.firstContent - Content for the first section
 * @param {React.ReactNode} props.secondContent - Content for the second section
 * @param {boolean} props.topDown - If true, layout is vertical (top-bottom)
 * @param {string} props.className - Additional classes for the wrapper
 * @param {number} props.firstRatio - Percentage width/flex for first section (only used if topDown is false)
 * @param {number} props.secondRatio - Percentage width/flex for second section (only used if topDown is false)
 */
const FlexibleSplit = ({
    firstContent,
    secondContent,
    topDown = false,
    className = '',
    firstRatio = 33,
    secondRatio = 67,
}) => {
    // Flex basis for desktop (ignored for topDown)
    const firstBasis = `${firstRatio}%`;
    const secondBasis = `${secondRatio}%`;

    return (
        <div
            className={
                topDown
                    ? `flex flex-col w-full min-h-[400px] ${className}`
                    : `flex flex-col sm:flex-row w-full min-h-[400px] ${className}`
            }
        >
            <div
                className={
                    topDown
                        ? `w-full flex flex-col justify-center p-4 sm:p-2 items-center text-center`
                        : `w-full sm:flex-1 flex flex-col justify-center sm:basis-[${firstBasis}] p-4 sm:p-2 items-center text-center sm:items-end sm:text-right`
                }
                style={topDown ? {} : {}}
            >
                {firstContent}
            </div>
            <div
                className={
                    topDown
                        ? `w-full flex flex-col justify-center p-4 sm:p-2 items-center text-center`
                        : `w-full sm:flex-1 flex flex-col justify-center sm:basis-[${secondBasis}] p-4 sm:p-2 items-center text-center sm:items-start sm:text-left`
                }
                style={topDown ? {} : {}}
            >
                {secondContent}
            </div>
        </div>
    );
};

export default FlexibleSplit;