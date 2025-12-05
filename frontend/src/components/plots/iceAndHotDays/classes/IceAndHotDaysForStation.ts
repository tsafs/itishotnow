import type XYData from "../../../../classes/XYData";

export interface IIceAndHotDaysForStation {
    stationId: string;
    iceDays: XYData;
    hotDays: XYData;
}