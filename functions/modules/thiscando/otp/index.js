import { TOTP, NobleCryptoPlugin, ScureBase32Plugin, generateSecret as _generateSecret } from 'otplib';

const totp = new TOTP({
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
});

export function generateSecret() {
    return _generateSecret();
}

export async function generateToken(secret) {
    return totp.generate({ secret });
}

export async function verifyToken(secret, token) {
    const result = await totp.verify(token, { secret });
    return result.valid;
}

export function totpURI(secret, label, issuer = 'thiscando') {
    return totp.toURI({ secret, label, issuer });
}

export default { generateSecret, generateToken, verifyToken, totpURI };
