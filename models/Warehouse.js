const mongoose = require('mongoose');

const warehouseSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    capacity: {
        type: Number,
        required: true
    },
    currentStock: {
        type: Number,
        default: 0
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    furniture: [{
        furnitureId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Furniture'
        },
        quantity: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Update current stock whenever furniture is modified
warehouseSchema.methods.updateStock = function() {
    this.currentStock = this.furniture.reduce((total, item) => total + item.quantity, 0);
    return this.save();
};

// Add furniture to warehouse
warehouseSchema.methods.addFurniture = function(furnitureId, quantity) {
    const existingItem = this.furniture.find(item =>
        item.furnitureId.toString() === furnitureId.toString()
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.lastUpdated = Date.now();
    } else {
        this.furniture.push({
            furnitureId,
            quantity,
            lastUpdated: Date.now()
        });
    }

    return this.updateStock();
};

// Remove furniture from warehouse
warehouseSchema.methods.removeFurniture = function(furnitureId, quantity) {
    const existingItem = this.furniture.find(item =>
        item.furnitureId.toString() === furnitureId.toString()
    );

    if (!existingItem) {
        throw new Error('Furniture not found in warehouse');
    }

    if (existingItem.quantity < quantity) {
        throw new Error('Insufficient stock');
    }

    existingItem.quantity -= quantity;
    existingItem.lastUpdated = Date.now();

    // Remove item if quantity is 0
    if (existingItem.quantity === 0) {
        this.furniture = this.furniture.filter(item =>
            item.furnitureId.toString() !== furnitureId.toString()
        );
    }

    return this.updateStock();
};

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;