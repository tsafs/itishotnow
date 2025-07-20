import * as d3 from 'd3';
import './MapTooltip.css';

class MapTooltip {
    constructor() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'station-tooltip') // Use the class from CSS file
            .style('opacity', 0);
    }

    show(name, markerX, markerY) {
        if (!name) return;

        // Get page coordinates from marker coordinates
        const pageX = window.pageXOffset + markerX;
        const pageY = window.pageYOffset + markerY;

        let tooltipContent = `<div class="station-tooltip-content">${name}</div>`;

        this.tooltip
            .html(tooltipContent)
            .style("left", pageX + "px")
            .style("top", (pageY - 40) + "px")
            .style("transform", "translateX(-50%)")
            .transition()
            .duration(200)
            .style('opacity', 0.9);
    }

    hide() {
        this.tooltip
            .transition()
            .duration(300)
            .style('opacity', 0);
    }

    destroy() {
        this.tooltip.remove();
    }
}

export default MapTooltip;
