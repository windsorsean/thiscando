import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const db = getFirestore();

/**
 * Loads a handler template from the firestore database
 * @async
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @param {object} utils - Built in utilities available to handlers.
 * @param {object} [vars={}] - Optional variables passed from config.
 */
export async function handleGetHandlerTemplate(req, res, utils, vars={}) {
    const { logger } = utils;

    try {
        // Attempt to retrieve the template from Firestore
        const templateDoc = await db.collection('config').doc('templates').get();

        // If not found, get from local file
        let template = templateDoc.exists ? JSON.parse(templateDoc.data().handler) : false;
        if (!template) {
            if (fs.existsSync('./handler-template.js')) {
                template = fs.readFileSync('./handler-template.js', 'utf8');
            }
            if (fs.existsSync('./handlers/handler-template.js')) {
                template = fs.readFileSync('./handlers/handler-template.js', 'utf8');
            }
        }

        // Send the handler data as the response
        res.status(200).send({ template: template || '' });
    } catch (error) {
        // If no firestore is available, use local file
        let template = '';
        if (fs.existsSync('./handler-template.js')) {
            template = fs.readFileSync('./handler-template.js', 'utf8');
        }
        if (fs.existsSync('./handlers/handler-template.js')) {
            template = fs.readFileSync('./handlers/handler-template.js', 'utf8');
        }
        res.status(200).send({ template: template || '' });
        logger({ error: error.message, stack: error.stack }, 'INFO');
    }
}
