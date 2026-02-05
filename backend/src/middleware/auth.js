import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Please authenticate.' });
    }
};

export default auth;
