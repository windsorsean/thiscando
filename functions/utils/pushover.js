import axios from 'axios';

const PUSHOVER_API_URL = 'https://api.pushover.net/1/messages.json';
const USER_KEY = process.env.PUSHOVER_USER_KEY;
const TOKEN = process.env.PUSHOVER_TOKEN;

/**
 * Sends a message using the Pushover API.
 * @param {Object} options - Options for sending the message.
 * @param {string} options.token - Your application's API token.
 * @param {string} options.user - The user/group key (not e-mail address).
 * @param {string} options.message - Your message.
 * @param {string} [options.title] - Your message's title, otherwise your app's name is used.
 * @param {string} [options.url] - A supplementary URL to show with your message.
 * @param {string} [options.url_title] - A title for your supplementary URL.
 * @param {number} [options.priority] - Message priority, see Pushover API docs.
 * @param {string} [options.sound] - The name of the sound to override the user's default sound choice.
 * @param {string} [options.device] - Your user's device name to send the message directly to that device.
 * @param {number} [options.timestamp] - A Unix timestamp of your message's date and time to display to the user.
 * @return {Promise<Object>} - The response from the Pushover API.
 * @throws {Error} If required parameters are missing or if there's an error sending the message.
*/
export default async function send(options) {
    // Remove undefined parameters
    const params = Object.entries(options).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
    }, {});

    // Add token/userkey if needed
    options.token = options.token ?? TOKEN;
    options.user = options.user ?? USER_KEY;

    // Throw error if missing required params
    if (!options.token) { throw new Error('missing token'); }
    if (!options.user) { throw new Error('missing user key'); }
    if (!options.message) { throw new Error('missing message'); }

    // Make pushover call
    const response = await axios.post(PUSHOVER_API_URL, params);
    return (response.data.status === 1);
}
