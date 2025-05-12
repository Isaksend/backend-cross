const Log = require('../models/Log');

// Middleware to log actions
const logAction = (action, targetModel = null) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json;

        // Override json method to capture response
        res.json = function(data) {
            // Call original json method
            originalJson.call(this, data);

            // Log the action after response is sent
            if (res.statusCode < 400 && req.user) {
                const logData = {
                    action,
                    user: req.user._id,
                    targetModel,
                    targetId: data._id || data.id || req.params.id,
                    details: {
                        method: req.method,
                        path: req.originalUrl,
                        body: req.body,
                        params: req.params,
                        query: req.query
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    status: 'success'
                };

                Log.createLog(logData).catch(error => {
                    console.error('Failed to create log:', error);
                });
            }
        };

        next();
    };
};

// Log errors
const logError = async (error, req, userId = null) => {
    try {
        const logData = {
            action: 'error',
            user: userId || req.user?._id,
            details: {
                error: error.message,
                stack: error.stack,
                method: req.method,
                path: req.originalUrl,
                body: req.body,
                params: req.params
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'failure',
            error: error.message
        };

        await Log.createLog(logData);
    } catch (logError) {
        console.error('Failed to log error:', logError);
    }
};

// Specific action loggers
const logActions = {
    // User actions
    userLogin: logAction('user_login', 'User'),
    userLogout: logAction('user_logout', 'User'),
    userCreated: logAction('user_created', 'User'),
    userUpdated: logAction('user_updated', 'User'),
    userDeleted: logAction('user_deleted', 'User'),
    roleAssigned: logAction('role_assigned', 'User'),

    // Furniture actions
    furnitureAdded: logAction('furniture_added', 'Furniture'),
    furnitureUpdated: logAction('furniture_updated', 'Furniture'),
    furnitureDeleted: logAction('furniture_deleted', 'Furniture'),
    furnitureSold: logAction('furniture_sold', 'Furniture'),
    furnitureArrival: logAction('furniture_arrival', 'Furniture'),

    // Warehouse actions
    warehouseCreated: logAction('warehouse_created', 'Warehouse'),
    warehouseUpdated: logAction('warehouse_updated', 'Warehouse'),
    warehouseDeleted: logAction('warehouse_deleted', 'Warehouse'),
    stockTransfer: logAction('stock_transfer', 'Warehouse')
};

module.exports = {
    logAction,
    logError,
    logActions
};