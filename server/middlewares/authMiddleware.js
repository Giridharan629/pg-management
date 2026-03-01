const jwt = require('jsonwebtoken');

const protectAdmin = (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            req.admin = jwt.verify(token, process.env.JWT_SECRET);
            next();
        } catch (error) {
            res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = protectAdmin;