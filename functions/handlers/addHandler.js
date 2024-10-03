import { getFirestore } from 'firebase-admin/firestore';
import esprima from 'esprima-next';
import { createHash } from 'crypto';

const db = getFirestore();

/**
 * Adds/updates a handler to the firestore database
 * @async
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @param {object} utils - Buit in utilities available to handlers.
 * @param {object} [vars={}] - Optional variables passed from config.
 */
export async function handleAddHandler(req, res, utils, vars={}) {
    // Validate javascript code
    try {
        esprima.parseModule(req.body.code);
    } catch (error) {
        res.status(400).send({
            error: 'Code validation failed.',
            result: error
        });
        return;
    }

    const docData = {
        code: JSON.stringify(req.body.code),
        name: req.body.name
    };

    // Add a MD5 hash of the code
    docData.hash = createHash('md5').update(docData.code).digest('hex');

    try {
        db.collection('handlers').doc(docData.name).set(docData);
    } catch (err) {
        res.status(500).send({ error: 'Unable to save to firestore' });
        return;
    }

    res.send({
        msg: 'Handler added.'
    });
}
