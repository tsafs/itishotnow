import React from 'react';
import PlotView from './PlotView.js';

interface CreatePlotViewOptions {
    leftContent: React.ComponentType;
    rightContent: React.ComponentType;
    config: {
        leftWidth?: number;
        title?: string;
        titleSide?: 'left' | 'right';
        darkMode?: boolean;
    };
    useShouldRender?: () => boolean;
}

export const createPlotView = (options: CreatePlotViewOptions) => {
    const PlotViewComponent = () => {
        // Call the hook to check if we should render
        const shouldRender = options.useShouldRender ? options.useShouldRender() : true;

        if (!shouldRender) {
            return null;
        }

        const LeftComp = options.leftContent;
        const RightComp = options.rightContent;

        return (
            <PlotView
                leftContent={<LeftComp />}
                rightContent={<RightComp />}
                {...options.config}
            />
        );
    };

    // Wrap in memo to prevent unnecessary re-renders
    return React.memo(PlotViewComponent);
};
