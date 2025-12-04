export interface IXYData {
    readonly x: ReadonlyArray<any>;
    readonly y: ReadonlyArray<any>;
    equals(other: IXYData): boolean;
}

export interface XYDataJSON {
    x: any[];
    y: any[];
}

/**
 * Represents a dataset with x and y values.
 */
export default class XYData implements IXYData {
    public readonly x: ReadonlyArray<any>;
    public readonly y: ReadonlyArray<any>;

    constructor(x: any[], y: any[]) {
        this.x = x;
        this.y = y;
    }

    equals(other: IXYData): boolean {
        return arraysEqual(this.x, other.x) && arraysEqual(this.y, other.y);
    }

    toJSON(): XYDataJSON {
        return {
            x: [...this.x],
            y: [...this.y],
        };
    }

    static fromJSON(json: XYDataJSON): XYData {
        return new XYData(json.x ?? [], json.y ?? []);
    }
}

function arraysEqual(a: ReadonlyArray<any>, b: ReadonlyArray<any>): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}