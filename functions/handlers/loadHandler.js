import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Loads a handler from the firestore database
 * @async
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @param {object} utils - Built in utilities available to handlers.
 * @param {object} [vars={}] - Optional variables passed from config.
 */
export async function handleLoadHandler(req, res, utils, vars={}) {
    const { logger } = utils;

    // Extract the handler name from the request
    const { name } = req.body;

    if (!name) {
        res.status(400).send({ error: 'Handler name is required' });
        return;
    }

    try {
        // Attempt to retrieve the handler from Firestore
        const handlerDoc = await db.collection('handlers').doc(name).get();

        if (!handlerDoc.exists) {
            res.status(404).send({ error: 'Handler not found' });
            return;
        }

        const handlerData = handlerDoc.data();

        // Send the handler data as the response
        res.status(200).send({
            name: handlerData.name,
            code: JSON.parse(handlerData.code)
        });
    } catch (error) {
        logger({ error: error.message, stack: error.stack }, 'ERROR');
        res.status(500).send({ error: 'Failed to load handler' });
    }
}
