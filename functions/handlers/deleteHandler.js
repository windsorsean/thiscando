import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Adds/updates a handler to the firestore database
 * @async
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @param {object} utils - Buit in utilities available to handlers.
 * @param {object} [vars={}] - Optional variables passed from config.
 */
export async function handleDeleteHandler(req, res, utils, vars={}) {
    try {
        db.collection('handlers').doc(req.body.name).delete();
    } catch (err) {
        res.status(500).send({ error: 'Unable to delete from firestore' });
        return;
    }

    res.send({
        msg: 'Handler deleted.'
    });
}
