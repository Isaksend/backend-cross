const mongoose = require('mongoose');

const logSchema = mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'user_login',
            'user_logout',
            'user_created',
            'user_updated',
            'user_deleted',
            'role_assigned',
            'furniture_added',
            'furniture_updated',
            'furniture_deleted',
            'furniture_sold',
            'furniture_arrival',
            'warehouse_created',
            'warehouse_updated',
            'warehouse_deleted',
            'stock_transfer'
        ]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetModel: {
        type: String,
        enum: ['User', 'Furniture', 'Warehouse', 'Barcode']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    },
    error: {
        type: String
    }
}, {
    timestamps: true
});

// Create compound index for efficient querying
logSchema.index({ user: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ targetModel: 1, targetId: 1, createdAt: -1 });

// Static method to create log entry
logSchema.statics.createLog = async function(data) {
    try {
        const log = new this(data);
        await log.save();
        return log;
    } catch (error) {
        console.error('Error creating log:', error);
        // Don't throw error to prevent log failures from affecting main operations
    }
};

// Method to get user activity logs
logSchema.statics.getUserActivity = async function(userId, limit = 50) {
    return this.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'fullName email role');
};

// Method to get recent actions
logSchema.statics.getRecentActions = async function(action, limit = 50) {
    return this.find({ action })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'fullName email role');
};

const Log = mongoose.model('Log', logSchema);

module.exports = Log;