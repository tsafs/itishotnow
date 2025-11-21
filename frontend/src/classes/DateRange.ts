export interface IDateRange {
    readonly from: string;
    readonly to: string;
    contains(date: string): boolean;
    equals(other: IDateRange): boolean;
}

export interface DateRangeJSON {
    from: string;
    to: string;
}

/**
 * Represents a date interval.
 */
export default class DateRange implements IDateRange {
    public readonly from: string;
    public readonly to: string;

    constructor(from: string, to: string) {
        this.from = from;
        this.to = to;
    }

    contains(date: string): boolean {
        return date >= this.from && date <= this.to;
    }

    equals(other: IDateRange): boolean {
        return this.from === other.from && this.to === other.to;
    }

    toJSON(): DateRangeJSON {
        return { from: this.from, to: this.to };
    }

    static fromJSON(obj: DateRangeJSON): DateRange {
        return new DateRange(obj.from, obj.to);
    }
}