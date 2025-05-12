const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Basic authentication middleware
const authMiddleware = async (req, res, next) => {
    try {
        // Получаем токен из заголовка
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Проверяем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

        // Получаем пользователя из базы данных
        const user = await User.findOne({ _id: decoded.userId, isActive: true });

        if (!user) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        next();
    };
};

// Permission-based authorization middleware
const checkPermission = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!req.user.canPerformAction(requiredRole)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

// Specific permission checks
const permissions = {
    // User management
    canManageUsers: authorize('admin'),
    canAssignRoles: authorize('admin'),

    // Warehouse management
    canManageWarehouses: authorize('admin'),
    canViewWarehouses: authorize('admin', 'manager', 'moderator'),

    // Furniture management
    canAddFurniture: authorize('admin', 'moderator'),
    canModifyFurniture: authorize('admin', 'moderator'),
    canDeleteFurniture: authorize('admin'),
    canSellFurniture: authorize('admin', 'manager', 'moderator'),
    canManageArrivals: authorize('admin', 'moderator'),

    // Logging
    canViewLogs: authorize('admin')
};

module.exports = {
    authMiddleware,
    authorize,
    checkPermission,
    permissions
};