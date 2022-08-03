import jwt from 'jsonwebtoken';
import configs from '../config';

const ONE_HOUR = 3600;
const ONE_DAY = ONE_HOUR * 24;

module.exports = {
    // Generates a token from supplied payload
    issue: (payload) => {
        return jwt.sign(payload, configs.jwtSecret, { expiresIn: ONE_DAY });
    },

    // Verifies token on a request
    verify: (token, callback) => {
        return jwt.verify(token, secret, callback);
    }
};
