import { RollingAverageRecordBuilder, type RollingAverageRecordMap } from '../../classes/RollingAverageRecord.js';

/**
 * Hydrate a JSON map of daily records back into class instances.
 * Accepts either { date, metrics: {..} } entries or flat metric maps.
 */
export function hydrateRollingAverageMap(jsonMap: Record<string, any>): RollingAverageRecordMap {
    const map: RollingAverageRecordMap = {};
    for (const [dateKey, json] of Object.entries(jsonMap ?? {})) {
        const date = json?.date ?? dateKey;
        const builder = new RollingAverageRecordBuilder().setDate(date);
        const metrics = json?.metrics ?? json;
        if (metrics && typeof metrics === 'object') {
            for (const [metric, value] of Object.entries(metrics)) {
                if (metric === 'date') continue;
                builder.setMetric(metric, value as number | undefined);
            }
        }
        const recordInstance = builder.build();
        if (recordInstance) {
            map[recordInstance.date] = recordInstance;
        }
    }
    return map;
}
