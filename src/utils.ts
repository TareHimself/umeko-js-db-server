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