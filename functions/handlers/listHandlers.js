import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Lists all handlers from the firestore database
 * @async
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @param {object} utils - Built in utilities available to handlers.
 * @param {object} [vars={}] - Optional variables passed from config.
 */
export async function handleListHandlers(req, res, utils, vars={}) {
    const { logger } = utils;

    try {
        // Retrieve all documents from the 'handlers' collection
        const handlersSnapshot = await db.collection('handlers').get();

        // Extract the names of all handlers
        const handlerNames = handlersSnapshot.docs.map((doc) => doc.id);

        // Send the list of handler names as the response
        res.status(200).send({
            handlers: handlerNames
        });
    } catch (error) {
        logger({ error: error.message, stack: error.stack }, 'ERROR');
        res.status(500).send({ error: 'Failed to list handlers' });
    }
}
