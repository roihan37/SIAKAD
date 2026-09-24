import express from 'express';
import { Controller } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMid';
import { trustedOrigin, authRateLimit } from '../middleware/authProtection';
const router = express.Router();
router.use(trustedOrigin);
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
router.post('/login', authRateLimit(20), Controller.login);
router.post('/refreshTokens', authRateLimit(120), Controller.refreshToken);
// Logout relies on its HttpOnly refresh cookie, not a possibly expired access token.
router.post('/logout', authRateLimit(120), Controller.revokeRefreshTokens);
router.post('/change-password', authRateLimit(10), authMiddleware, Controller.changePassword);
export default router;
