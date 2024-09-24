import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

dotenv.config();
initializeApp();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = getFirestore();

/** @type {Array<Object>} */
let handlerConfig;

const tempDir = path.join(os.tmpdir(), 'thiscando-handlers');

/**
 * Initializes the application by loading the configuration and ensuring the temp directory exists.
 * @async
 * @throws {Error} If there's an issue loading the configuration or creating the temp directory.
 */
async function init() {
    await fs.mkdir(tempDir, { recursive: true });
    let config = {};

    // Load the local config file
    try {
        const configFile = await fs.readFile(path.join(__dirname, 'config.json'), 'utf8');
        config = JSON.parse(configFile);
    } catch (error) {
        logger(error, 'ERROR');
        process.exit(1);
    }

    // If config file says to look at firestore, reload all config settings from firestore
    if (config.source === 'firestore') {
        const configFirestore = (await db.collection('config').doc('settings').get()).data();
        if (configFirestore.source === 'local') {
            config.source = 'local';
        } else {
            config = configFirestore;
        }
    }

    // Turn on debug if needed
    process.env.DEBUG_ENABLED = config.debug ? 'true' : 'false';

    logger({ config }, 'DEBUG');

    switch (config.source) {
    case 'local':
        handlerConfig = config.handlers;
        break;
    case 'firestore':
        try {
            handlerConfig = Object.values((await db.collection('config').doc('handlers').get()).data());
        } catch (error) {
            console.error('Error loading config from Firestore:', error);
            process.exit(1);
        }
        break;
    default:
        logger('Invalid handler source.', 'ERROR');
        process.exit(1);
    }

    logger({ handlerConfig }, 'DEBUG');
}

/**
 * Loads a handler function, either from the local file system or from Firestore.
 * @async
 * @param {string} functionName - The name of the function to load.
 * @return {Function} The loaded handler function.
 * @throws {Error} If the handler function is not found or is invalid.
 */
async function loadHandler(functionName) {
    const localPath = path.join(__dirname, 'handlers', `${functionName}.js`);
    logger({ localPath }, 'DEBUG');
    try {
        // Check if the file exists locally
        await fs.access(localPath);
        const module = await import(localPath);
        return module[`handle${functionName.charAt(0).toUpperCase() + functionName.slice(1)}`];
    } catch (error) {
        // If the file doesn't exist locally, load from Firestore
        const handlerDoc = await db.collection('handlers').doc(functionName).get();
        if (!handlerDoc.exists) {
            throw new Error(`Handler ${functionName} not found in Firestore`);
        }
        const handlerData = handlerDoc.data();
        const tempPath = path.join(tempDir, `${functionName}.mjs`);
        await fs.writeFile(tempPath, JSON.parse(handlerData.code));
        const module = await import(tempPath);
        logger(`module loaded: ${tempPath}`, 'DEBUG');
        return module[`handle${functionName.charAt(0).toUpperCase() + functionName.slice(1)}`];
    }
}

/**
 * Matches the incoming request to a configured route.
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @return {Object|undefined} The matched route configuration, or undefined if no match.
 */
function matchRoute(req) {
    logger({ path: req.path }, 'DEBUG');
    return handlerConfig.find((route) => {
        const path = req.path.replace(/^\/[^/]+\//, '/');
        // Ensure 'path' is present and not root
        if (!route.match?.path || route.match?.path.toLowerCase() === '/') {
            return false;
        }

        // Check if all properties in 'match' are satisfied
        return Object.entries(route.match).every(([key, value]) => {
            switch (key.toLowerCase()) {
            case 'path':
                return path.toLowerCase() === value.toLowerCase();
            case 'body':
                return matchBody(req.body, value);
            case 'params':
                return matchParams(req.query, value);
                // Add more cases here for other properties you want to match
            default:
                return false; // Unknown property, consider it unmatched
            }
        });
    });
}

/**
 * Matches the request body against the configured body match rules.
 * @param {Object} reqBody - The request body.
 * @param {Object} matchRules - The body match rules from config.
 * @return {boolean} True if all rules are satisfied, false otherwise.
 */
function matchBody(reqBody, matchRules) {
    logger('matchBody', 'DEBUG');
    return Object.entries(matchRules).every(([key, value]) => {
        if (!(key in reqBody)) {
            return false; // The key must exist in the request body
        }

        const reqValue = reqBody[key];

        if (value === '*') {
            return true; // Wildcard matches any value, as long as the key exists
        }

        if (typeof value !== 'string') {
            // For non-string config values, use strict equality
            return reqValue === value;
        }

        // For string config values, use the existing wildcard matching logic
        return typeof reqValue === 'string' && matchStringWithWildcard(reqValue, value);
    });
}

/**
 * Matches the request URL parameters against the configured parameter match rules.
 * @param {Object} reqParams - The request URL parameters.
 * @param {Object} matchRules - The parameter match rules from config.
 * @return {boolean} True if all rules are satisfied, false otherwise.
 */
function matchParams(reqParams, matchRules) {
    logger('matchParams', 'DEBUG');
    return Object.entries(matchRules).every(([key, value]) => {
        const reqValue = reqParams[key];

        if (typeof reqValue !== 'string' || typeof value !== 'string') {
            return false;
        }

        return matchStringWithWildcard(reqValue, value);
    });
}

/**
 * Matches a string against a pattern, supporting wildcards.
 * @param {string} str - The string to match.
 * @param {string} pattern - The pattern to match against, which may include wildcards.
 * @return {boolean} True if the string matches the pattern, false otherwise.
 */
function matchStringWithWildcard(str, pattern) {
    logger('matchStringWithWildcard', 'DEBUG');
    const lowerStr = str.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    if (lowerPattern === '*') {
        // Matches anything
        return true;
    } else if (lowerPattern.startsWith('*') && lowerPattern.endsWith('*')) {
        // *contains* match
        return lowerStr.includes(lowerPattern.slice(1, -1));
    } else if (lowerPattern.startsWith('*')) {
        // *endswith match
        return lowerStr.endsWith(lowerPattern.slice(1));
    } else if (lowerPattern.endsWith('*')) {
        // startswith* match
        return lowerStr.startsWith(lowerPattern.slice(0, -1));
    } else {
        // Exact match
        return lowerStr === lowerPattern;
    }
}

/**
 * Handles the matched route by dynamically loading and calling the appropriate function.
 * @async
 * @param {Object} route - The matched route configuration.
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @throws {Error} If there's an error handling the route or if the handler function is invalid.
 */
async function handleRoute(route, req, res) {
    try {
        const handler = await loadHandler(route.function);
        if (typeof handler === 'function') {
            await handler(req, res);
        } else {
            throw new Error(`Handler function for ${route.function} is not a valid function`);
        }
    } catch (error) {
        logger({ msg: `Error handling route ${route.function}:`, error }, 'ERROR');
        res.status(500).send('Internal Server Error');
    }
}

/**
 * Main handler for incoming HTTP requests.
 */
export const handler = onRequest({ region: 'northamerica-northeast1' }, async (req, res) => {
    await init();
    logger({ request: { method: req.method, body: req.body, query: req.query, headers: req.headers } }, 'DEBUG');
    try {
        const route = matchRoute(req);
        if (route) {
            await handleRoute(route, req, res);
        } else {
            logger('No handler was found.', 'DEBUG');
            res.status(404).send({ error: 'Not Found' });
        }
    } catch (error) {
        logger(error, 'ERROR');
        res.status(500).send('Internal Server Error');
    }
});
