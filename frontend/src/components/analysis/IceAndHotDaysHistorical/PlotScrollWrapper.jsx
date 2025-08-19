const PlotScrollWrapper = ({ width, children }) => (
    <div
        className="overflow-x-auto overflow-y-hidden w-full max-w-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
        style={{ WebkitOverflowScrolling: 'touch' }}
    >
        <div className={`min-w-[${width}px] inline-block`}>
            {children}
        </div>
    </div>
);

export default PlotScrollWrapper;
