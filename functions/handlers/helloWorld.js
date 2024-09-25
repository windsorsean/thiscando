/**
 * Hello World function to confirm things are working (use a GET request)
 * @async
 * @param {functions.https.Request} req - The Firebase Functions request object.
 * @param {functions.Response} res - The Firebase Functions response object.
 * @param {object} [vars={}] - Optional variables passed from config.
 */
export async function handleHelloWorld(req, res, vars = {}) {
    res.send({
        message: 'Hello world!',
        data: req.query ?? 'none',
        vars
    });
}
