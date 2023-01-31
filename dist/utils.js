"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueryParameters = exports.encodeOptions = exports.log = exports.buildResponse = void 0;
function buildResponse(data, error = false) {
    return {
        data, error
    };
}
exports.buildResponse = buildResponse;
function log(...data) {
    console.log.apply(null, data);
}
exports.log = log;
function encodeOptions(data) {
    return new URLSearchParams(data).toString();
}
exports.encodeOptions = encodeOptions;
async function getQueryParameters(query, getters) {
    const results = {};
    for (let i = 0; i < getters.length; i++) {
        const [isValid, value] = await getters[i].checkAndGet(query[getters[i].name]);
        console.log(isValid, value);
        if (!isValid) {
            return null;
        }
        results[getters[i].name] = value;
    }
    return results;
}
exports.getQueryParameters = getQueryParameters;
