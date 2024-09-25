import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Handles adding a new handler config
 * @async
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @param {object} [vars={}] - Optional variables passed from config.
 */
export async function handleAddConfig(req, res, vars={}) {
    // Get existing config
    const config = (await db.collection('config').doc('handlers').get()).data() || {};

    // Add/update handler config
    config[req.body.function] = req.body;
    console.log(config);

    db.collection('config').doc('handlers').set(config);

    // Implement VOIP SMS logic here
    res.send({
        msg: 'Config imported.'
    });
}
