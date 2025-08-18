/**
 * @class XYData
 * Represents a dataset with x and y values.
 */
export default class XYData {
    /**
     * @param {Array<any>} x
     * @param {Array<any>} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y
        };
    }

    static fromJSON(obj) {
        return new XYData(obj.x, obj.y);
    }
}