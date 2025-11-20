import type { ReactNode, CSSProperties } from 'react';
import './ContentSplit.css';

type ContentSplitStyle = CSSProperties & {
    '--first-ratio'?: number | string;
    '--second-ratio'?: number | string;
};

interface ContentSplitProps {
    leftContent: ReactNode;
    rightContent: ReactNode;
    reversed?: boolean;
    className?: string;
    style?: ContentSplitStyle;
    leftRatio?: number;
    rightRatio?: number;
}

const ContentSplit = ({
    leftContent,
    rightContent,
    reversed = false,
    className = '',
    style,
    leftRatio = 33,
    rightRatio = 67,
}: ContentSplitProps) => {
    // If reversed, swap the render order so the right content appears first.
    const firstContent = reversed ? rightContent : leftContent;
    const secondContent = reversed ? leftContent : rightContent;

    // Align the width ratios with the order chosen above to keep proportions correct.
    const firstRatio = reversed ? rightRatio : leftRatio;
    const secondRatio = reversed ? leftRatio : rightRatio;

    // Combine caller styles with the CSS variables that control each side's width.
    const combinedStyle: ContentSplitStyle = {
        ...(style ?? {}),
        '--first-ratio': firstRatio,
        '--second-ratio': secondRatio,
    };

    return (
        <div
            className={`content-split ${className}`}
            style={combinedStyle}
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
