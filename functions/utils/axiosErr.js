/**
 * Parses an Axios error into a structured format for easier debugging.
 * @param {Error} err - The error object, expected to be an Axios error.
 * @param {boolean} [asJson=false] - If true, returns error as a JSON string; otherwise, returns as an object.
 * @param {boolean} [includeStack=false] - If true, includes the stack trace in the parsed error output.
 * @return {string|Object} - The parsed error as a JSON string or an object, based on the `as_json` flag.
 */
export default function parse(err, asJson = false, includeStack = false) {
    // Check if the error is an Axios error
    if (!err.isAxiosError) {
        // Return a standard error object or JSON string for non-Axios errors
        return asJson ? JSON.stringify({ message: err.message, stack: err.stack }, null, 3) : err;
    }

    // Structure the error details for an Axios error
    let errObject = {
        error: err.code ?? 'Unknown Error',
        message: err.message ?? null,
        request: {
            method: err.request?.method ?? null,
            url: err.config?.url ?? null,
            protocol: err.request?.protocol ?? null,
            host: err.request?.host ?? null,
            path: err.request?.path ?? null,
            headers: err.config?.headers ?? null,
            params: err.config?.params ?? null,
            data: err.config?.data ?? null,
            timeout: err.config?.timeout ?? null,
            baseURL: err.config?.baseURL ?? null
        },
        response: {
            status: err.response?.status ?? null,
            statusText: err.response?.statusText ?? null,
            headers: err.response?.headers ?? null,
            data: err.response?.data ?? null,
            responseURL: err.response?.request?.res?.responseUrl ?? null
        },
        ...(includeStack && { stack: err.stack })
    };

    // If possible let's JSONify the object
    try { errObject = JSON.parse(JSON.stringify(errObject)); } catch { errObject; }

    // Return as JSON string or object based on the as_json flag
    return asJson ? JSON.stringify(errObject, null, 3) : errObject;
}
