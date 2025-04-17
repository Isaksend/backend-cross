const Furniture = require('../models/Furniture');

// Получить все предметы мебели
const getFurniture = async (req, res) => {
    try {
        const furniture = await Furniture.find({});
        res.json(furniture);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Получить предмет мебели по ID
const getFurnitureById = async (req, res) => {
    try {
        const furniture = await Furniture.findById(req.params.id);
        if (furniture) {
            res.json(furniture);
        } else {
            res.status(404).json({ message: 'Предмет мебели не найден' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Создать новый предмет мебели
const createFurniture = async (req, res) => {
    const { name, imageUrl, description, dimensions, price } = req.body;

    try {
        const furniture = await Furniture.create({
            name,
            imageUrl,
            description,
            dimensions,
            price
        });
        res.status(201).json(furniture);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Обновить предмет мебели
const updateFurniture = async (req, res) => {
    const { name, imageUrl, description, dimensions, price } = req.body;

    try {
        const furniture = await Furniture.findById(req.params.id);

        if (furniture) {
            furniture.name = name || furniture.name;
            furniture.imageUrl = imageUrl || furniture.imageUrl;
            furniture.description = description || furniture.description;
            furniture.dimensions = dimensions || furniture.dimensions;
            furniture.price = price !== undefined ? price : furniture.price;

            const updatedFurniture = await furniture.save();
            res.json(updatedFurniture);
        } else {
            res.status(404).json({ message: 'Предмет мебели не найден' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Удалить предмет мебели
const deleteFurniture = async (req, res) => {
    try {
        const furniture = await Furniture.findById(req.params.id);

        if (furniture) {
            await Furniture.deleteOne({ _id: furniture._id });
            res.json({ message: 'Предмет мебели удален' });
        } else {
            res.status(404).json({ message: 'Предмет мебели не найден' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFurniture,
    getFurnitureById,
    createFurniture,
    updateFurniture,
    deleteFurniture
};