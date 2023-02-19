import { IQueryParameterValidation } from "./types";

export function buildResponse<T = any>(data: T, error = false) {
    return {
        data, error
    }
}

export function log(...data) {
    console.log.apply(null, data);
}

export async function getQueryParameters(query: Record<string, string>, getters: IQueryParameterValidation[]) {
    const results: { [key: string]: any } = {}

    for (let i = 0; i < getters.length; i++) {
        const [isValid, value] = await getters[i].checkAndGet(query[getters[i].name])
        if (!isValid) {
            return null
        }
        results[getters[i].name] = value;
    }

    return results;
}

export function pad(number: number) {
    return number < 10 ? `0${number}` : `${number}`;
}

/**
 * Converts a date object to an integer formated as YYYYMMDDHHMMSS
 */
export function TimeToInteger(date: Date) {
    return parseInt(
        `${date.getUTCFullYear()}${pad(date.getUTCMonth())}${pad(
            date.getUTCDate()
        )}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
            date.getUTCSeconds()
        )}`,
        10
    );
}