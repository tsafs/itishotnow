import React from 'react';
import './ContentSplit.css';

/**
 * A component that splits content into two columns with configurable ratio
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.leftContent - Content to display on the left side
 * @param {React.ReactNode} props.rightContent - Content to display on the right side
 * @param {boolean} props.reversed - Whether to reverse the order (swap left/right)
 * @param {string} props.className - Additional CSS class
 * @param {Object} props.style - Additional inline styles
 * @param {number} props.leftRatio - Flex proportion for left side (default: 33)
 * @param {number} props.rightRatio - Flex proportion for right side (default: 67)
 */
const ContentSplit = ({
    leftContent,
    rightContent,
    reversed = false,
    className = '',
    style = {},
    leftRatio = 33,
    rightRatio = 67
}) => {
    // Determine content order based on reversed prop
    const firstContent = reversed ? rightContent : leftContent;
    const secondContent = reversed ? leftContent : rightContent;

    // Determine ratios based on reversed prop
    const firstRatio = reversed ? rightRatio : leftRatio;
    const secondRatio = reversed ? leftRatio : rightRatio;

    return (
        <div
            className={`content-split ${className}`}
            style={{
                ...style,
                '--first-ratio': firstRatio,
                '--second-ratio': secondRatio
            }}
        >
            <div className="content-split-side">
                {firstContent}
            </div>
            <div className="content-split-side">
                {secondContent}
            </div>
        </div>
    );
};

export default ContentSplit;
