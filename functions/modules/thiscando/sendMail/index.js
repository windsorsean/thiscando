import nodemailer from 'nodemailer';

/**
 * Checks if a string is likely to be HTML content.
 * @param {string} str - The string to check.
 * @return {boolean} True if the string is likely HTML, false otherwise.
 */
function isLikelyHTML(str) {
    const htmlRegex = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
    return htmlRegex.test(str.trim());
}

/**
 * Converts an object to HTML representation.
 * @param {Object} obj - The object to convert.
 * @param {number} [indent=0] - The indentation level.
 * @return {string} HTML representation of the object.
 */
function objectToHTML(obj, indent = 1) {
    let html = '<div style="font-family: monospace;">\n';

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            html += `<div style="margin-left: ${indent * 20}px;"><strong>${key}:</strong></div>\n`;
            html += objectToHTML(value, indent + 1);
        } else {
            html += `<div style="margin-left: ${indent * 20}px;"><strong>${key}:</strong> ${value}</div>\n`;
        }
    }

    html += '</div>';
    return html;
}

/**
 * Sends an email using SMTP.
 * @param {string|Object} bodyOrConfig - The email body or a configuration object.
 * @param {string} [subject] - The email subject (if not using config object).
 * @param {string} [to] - The recipient's email address (if not using config object).
 * @param {string} [from] - The sender's email address (if not using config object).
 * @param {Object} [smtpConfig] - SMTP config (if not using config object).
 * @return {Promise<Object>} The result of the email sending operation.
 * @throws {Error} If SMTP configuration is missing or if there's an error sending the email.
 */
export default async function sendMail(bodyOrConfig, subject, to, from, smtpConfig) {
    let body;

    // Determine if we're using a config object or individual parameters
    if (typeof bodyOrConfig === 'object' && bodyOrConfig !== null && !Array.isArray(bodyOrConfig)) {
        ({ body, subject = 'No Subject', to = '', from = '', smtpConfig = {} } = bodyOrConfig);
    } else {
        body = bodyOrConfig;
        smtpConfig = smtpConfig || {};
    }

    // Validate required fields
    if (!body) throw new Error('Email body is required');
    if (!to) throw new Error('Recipient (to) email address is required');
    if (!from) throw new Error('Sender (from) email address is required');

    let htmlBody = typeof body === 'object' ? objectToHTML(body, 1) : body;

    if (!isLikelyHTML(htmlBody)) {
        htmlBody = `<p>${htmlBody.replace(/\n/g, '<br>\n')}</p>`;
    }

    const smtpSettings = {
        host: smtpConfig.host ?? process.env.SMTP_SERVER ?? '',
        port: smtpConfig.port ?? 465,
        secure: true,
        auth: {
            user: smtpConfig.auth?.user ?? process.env.SMTP_USER ?? '',
            pass: smtpConfig.auth?.pass ?? process.env.SMTP_PASS ?? ''
        }
    };

    if (!(smtpSettings.host && smtpSettings.port && smtpSettings.auth.user && smtpSettings.auth.pass)) {
        throw new Error('Missing SMTP configuration');
    }

    const transporter = nodemailer.createTransport(smtpSettings);

    const mailOptions = {
        from,
        to,
        subject,
        html: htmlBody
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email: ' + error.message);
    }
}
