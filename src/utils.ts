import { IQueryParameterValidation } from "./types";

export function buildResponse<T = any>(data: T, error = false) {
    return {
        data, error
    }
}

export function log(...data) {
    console.log.apply(null, data);
}

export function encodeOptions(data: Record<string, any>) {
    return new URLSearchParams(data).toString()
}

export async function getQueryParameters(query: Record<string, string>, getters: IQueryParameterValidation[]) {
    const results: { [key: string]: any } = {}

    for (let i = 0; i < getters.length; i++) {
        const [isValid, value] = await getters[i].checkAndGet(query[getters[i].name])
        console.log(isValid, value)
        if (!isValid) {
            return null
        }
        results[getters[i].name] = value;
    }

    return results;
}