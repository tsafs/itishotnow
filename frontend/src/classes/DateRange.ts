export interface DateRangeJSON {
    from: string;
    to: string;
}

export type IDateRange = DateRangeJSON;

/**
 * Represents a date interval.
 */
export default class DateRange implements DateRangeJSON {
    public readonly from: string;
    public readonly to: string;

    constructor(from: string, to: string) {
        this.from = from;
        this.to = to;
    }

    toJSON(): DateRangeJSON {
        return { from: this.from, to: this.to };
    }

    static fromJSON(obj: DateRangeJSON): DateRange {
        return new DateRange(obj.from, obj.to);
    }
}