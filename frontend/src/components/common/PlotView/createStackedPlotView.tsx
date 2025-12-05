import React from 'react';
import StackedPlotView from './StackedPlotView.js';

interface CreateStackedPlotViewOptions {
    topContent: React.ComponentType;
    bottomContent: React.ComponentType;
    config: {
        darkMode?: boolean;
    };
    useShouldRender?: () => boolean;
}

export const createStackedPlotView = (options: CreateStackedPlotViewOptions) => {
    const StackedPlotViewComponent = () => {
        // Call the hook to check if we should render
        const shouldRender = options.useShouldRender ? options.useShouldRender() : true;

        if (!shouldRender) {
            return null;
        }

        const TopComp = options.topContent;
        const BottomComp = options.bottomContent;

        return (
            <StackedPlotView
                topContent={<TopComp />}
                bottomContent={<BottomComp />}
                {...options.config}
            />
        );
    };

    // Wrap in memo to prevent unnecessary re-renders
    return React.memo(StackedPlotViewComponent);
};
