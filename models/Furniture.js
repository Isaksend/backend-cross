const mongoose = require('mongoose');

const furnitureSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dimensions: {
        type: Object
    },
    price: {
        type: Number
    }
}, {
    timestamps: true
});

const Furniture = mongoose.model('Furniture', furnitureSchema);

module.exports = Furniture;