const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'moderator'],
        default: 'moderator'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has specific role
userSchema.methods.hasRole = function(role) {
    return this.role === role;
};

// Check if user can perform action based on role hierarchy
userSchema.methods.canPerformAction = function(requiredRole) {
    const roleHierarchy = {
        'admin': 3,
        'manager': 2,
        'moderator': 1
    };

    return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
};

const User = mongoose.model('User', userSchema);

module.exports = User;