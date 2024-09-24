import fs from 'fs';
import logger from 'firebase-functions/logger';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '..', 'thiscando.log');
const IS_LOCAL = !('GAE_RUNTIME' in process.env);

/**
 * @typedef {Object} LogData
 * @property {string} severity - Log severity level
 * @property {*} message - Log message
 * @property {Object} sourceLocation - Source location information
 * @property {string} sourceLocation.function - Function name
 * @property {string} sourceLocation.file - File name
 * @property {string} sourceLocation.line - Line number
 * @property {string} timestamp - ISO timestamp
 */

/**
 * Outputs log to the console in a Google Cloud friendly way.
 * Also writes to temp file when running locally.
 * @param {*} data - The data to log
 * @param {'DEBUG'|'INFO'|'NOTICE'|'WARNING'|'ERROR'|'CRITICAL'|'ALERT'|'EMERGENCY'} [severity='auto'] - Log severity
 */
export default function log(data, severity = 'auto') {
    const debugEnabled = process.env.DEBUG_ENABLED === 'true';
    const now = new Date();

    // Ignore severity debug unless debug is enabled
    if (severity.toLowerCase() === 'debug' && !debugEnabled) { return; }

    // See if data is JSON string first and if so convert to object
    if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
        try { data = JSON.parse(data); } catch { data; }
    }

    // Make copy of data object
    let dataCopy;
    try {
        dataCopy = structuredClone(data);
    } catch {
        console.error('Unable to make object copy for logging.');
        console.log(data);
        return;
    }

    if (!IS_LOCAL) {
        dataCopy = hidePrivate(dataCopy);
    }

    const dataString = stringifyData(dataCopy);

    if (severity === 'auto') {
        severity = determineSeverity(dataString);
    }

    const stack = new Error().stack;
    /** @type {LogData} */
    const logObj = {
        severity,
        message: dataCopy,
        sourceLocation: formatStack(stack),
        timestamp: now.toISOString()
    };

    if (IS_LOCAL) {
        console.dir(logObj, { depth: 5 });
        writeToFile(logObj);
    } else {
        logger.write(logObj);
    }
}

/**
 * Stringifies the data for logging
 * @param {*} data
 * @return {string}
 */
function stringifyData(data) {
    if (typeof data === 'object') {
        return JSON.stringify(data, null, 3);
    }
    if (Array.isArray(data)) {
        return data.join(', ');
    }
    return String(data);
}

/**
 * Determines the severity based on the log content
 * @param {string} message
 * @return {'INFO'|'ERROR'}
 */
function determineSeverity(message) {
    const errorKeywords = ['error', 'failure', 'failed'];
    return errorKeywords.some((keyword) => message.toLowerCase().includes(keyword)) ? 'ERROR' : 'INFO';
}

/**
 * Formats the stack trace string
 * @param {string} stackString
 * @return {Object}
 */
function formatStack(stackString) {
    const stackLines = stackString.split('\n').filter((item) => item.includes(' at '));
    const lineNum = stackLines[0].includes('logger.js') ? 1 : 0;
    const callSite = stackLines[lineNum].trim().split(' ');
    return {
        function: callSite.length > 2 ? callSite[1] : '',
        file: /\/([^/^:]+):/.exec(stackLines[lineNum])[1] ?? 'unknown',
        line: /:(\d+):/.exec(stackLines[lineNum])[1] ?? 'unknown'
    };
}

/**
 * Writes log object to a file
 * @param {LogData} logObj
 */
function writeToFile(logObj) {
    try {
        fs.appendFileSync(logFile, JSON.stringify(logObj, null, 3) + ',\n', 'utf8');
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

/**
 * Strips any private data from an object
 * @param {*} data
 * @return {*}
 */
export function hidePrivate(data) {
    // Only move forward with objects otherwise return as-is
    if (data === null || typeof data !== 'object') {
        return data;
    }

    // Don't modify the original if we can copy it
    let dataCopy;
    try {
        dataCopy = structuredClone(data);
    } catch {
        return data;
    }

    for (const [key, value] of Object.entries(dataCopy)) {
        if (typeof value === 'object') {
            dataCopy[key] = hidePrivate(value);
        } else if (shouldHideValue(key)) {
            dataCopy[key] = maskValue(value);
        }
    }

    return dataCopy;
}

/**
 * Determines if a value should be hidden based on its key
 * @param {string} key
 * @return {boolean}
 */
function shouldHideValue(key) {
    const sensitivePatterns = [
        /token|password|secret|private|authorization/i,
        /^serialnumber$|^vin$/i,
        /email|phone|address/i
    ];
    const excludePatterns = [/^url|^uri|url$|uri$/i];

    return sensitivePatterns.some((pattern) => pattern.test(key)) &&
           !excludePatterns.some((pattern) => pattern.test(key));
}

/**
 * Masks a value for privacy
 * @param {string} value
 * @return {string}
 */
function maskValue(value) {
    const str = String(value);
    const showLength = str.length > 7 ? 4 : 1;
    return str.substring(0, showLength) + '****';
}
