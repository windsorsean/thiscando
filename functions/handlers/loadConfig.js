import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Handles adding a new handler config
 * @async
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @param {object} utils - Buit in utilities available to handlers.
 * @param {object} [vars={}] - Optional variables passed from config.
 */
export async function handleLoadConfig(req, res, utils, vars={}) {
    // Get existing config
    try {
        const config = (await db.collection('config').doc('handlers').get()).data() || {};

        // Get handler config
        if (req.body.function === 'all') {
            res.send({ config });
        } else {
            if (config[req.body.function]) {
                res.send({ config: config[req.body.function] });
            } else {
                res.status(400).send({ error: 'Handler config not found.' });
            }
        }
    } catch (err) {
        res.status(500).send({ error: 'Failed to load config' });
        throw new Error('Failed to load config');
    }
}
