const Furniture = require('../models/Furniture');
const Warehouse = require('../models/Warehouse');
const { logError } = require('../middleware/loggingMiddleware');

// Получить все предметы мебели
const getFurniture = async (req, res) => {
    try {
        const furniture = await Furniture.find({});
        res.json(furniture);
    } catch (error) {
        await logError(error, req);
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
        await logError(error, req);
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
            price,
            createdBy: req.user._id
        });
        res.status(201).json(furniture);
    } catch (error) {
        await logError(error, req);
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
            furniture.updatedBy = req.user._id;

            const updatedFurniture = await furniture.save();
            res.json(updatedFurniture);
        } else {
            res.status(404).json({ message: 'Предмет мебели не найден' });
        }
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Удалить предмет мебели
const deleteFurniture = async (req, res) => {
    try {
        const furniture = await Furniture.findById(req.params.id);

        if (furniture) {
            // Удаляем мебель из всех складов
            await Warehouse.updateMany(
                { 'furniture.furnitureId': furniture._id },
                { $pull: { furniture: { furnitureId: furniture._id } } }
            );

            await Furniture.deleteOne({ _id: furniture._id });
            res.json({ message: 'Предмет мебели удален' });
        } else {
            res.status(404).json({ message: 'Предмет мебели не найден' });
        }
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

// Продать мебель
const sellFurniture = async (req, res) => {
    try {
        const { warehouseId, quantity, customerInfo } = req.body;

        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        const furniture = await Furniture.findById(req.params.id);
        if (!furniture) {
            return res.status(404).json({ message: 'Предмет мебели не найден' });
        }

        // Удаляем со склада
        await warehouse.removeFurniture(furniture._id, quantity);

        // Создаем запись о продаже
        const saleRecord = {
            furnitureId: furniture._id,
            warehouseId: warehouse._id,
            quantity,
            price: furniture.price * quantity,
            soldBy: req.user._id,
            customerInfo,
            date: new Date()
        };

        res.json({
            message: 'Мебель успешно продана',
            sale: saleRecord
        });
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Зарегистрировать поступление мебели
const registerArrival = async (req, res) => {
    try {
        const { warehouseId, quantity, arrivalDetails } = req.body;

        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        const furniture = await Furniture.findById(req.params.id);
        if (!furniture) {
            return res.status(404).json({ message: 'Предмет мебели не найден' });
        }

        // Добавляем на склад
        await warehouse.addFurniture(furniture._id, quantity);

        // Создаем запись о поступлении
        const arrivalRecord = {
            furnitureId: furniture._id,
            warehouseId: warehouse._id,
            quantity,
            registeredBy: req.user._id,
            arrivalDetails,
            date: new Date()
        };

        // TODO: Отправить уведомления соответствующим пользователям

        res.json({
            message: 'Поступление успешно зарегистрировано',
            arrival: arrivalRecord
        });
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Получить доступность мебели по складам
const getFurnitureAvailability = async (req, res) => {
    try {
        const furniture = await Furniture.findById(req.params.id);
        if (!furniture) {
            return res.status(404).json({ message: 'Предмет мебели не найден' });
        }

        const warehouses = await Warehouse.find({
            'furniture.furnitureId': furniture._id
        }).select('name location furniture');

        const availability = warehouses.map(warehouse => {
            const item = warehouse.furniture.find(
                f => f.furnitureId.toString() === furniture._id.toString()
            );
            return {
                warehouseId: warehouse._id,
                warehouseName: warehouse.name,
                location: warehouse.location,
                quantity: item ? item.quantity : 0,
                lastUpdated: item ? item.lastUpdated : null
            };
        });

        res.json({
            furniture: {
                _id: furniture._id,
                name: furniture.name,
                description: furniture.description
            },
            availability
        });
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

// Сканировать мебель по коду (ID)
const scanFurniture = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Код мебели обязателен' });
        }

        // Найти мебель по ID
        const furniture = await Furniture.findById(code);

        if (!furniture) {
            return res.status(404).json({ message: 'Мебель с данным кодом не найдена' });
        }

        // Получить информацию о складах
        const warehouses = await Warehouse.find({
            'furniture.furnitureId': furniture._id
        }).select('name location furniture');

        const stockInfo = warehouses.map(warehouse => {
            const item = warehouse.furniture.find(
                f => f.furnitureId.toString() === furniture._id.toString()
            );
            return {
                warehouseId: warehouse._id,
                warehouseName: warehouse.name,
                location: warehouse.location,
                quantity: item ? item.quantity : 0,
                lastUpdated: item ? item.lastUpdated : null
            };
        });

        // Подсчет общего количества
        const totalStock = stockInfo.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            furniture: {
                _id: furniture._id,
                name: furniture.name,
                description: furniture.description,
                imageUrl: furniture.imageUrl,
                dimensions: furniture.dimensions,
                price: furniture.price,
                createdAt: furniture.createdAt,
                updatedAt: furniture.updatedAt
            },
            stock: {
                total: totalStock,
                warehouses: stockInfo
            }
        });
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFurniture,
    getFurnitureById,
    createFurniture,
    updateFurniture,
    deleteFurniture,
    sellFurniture,
    registerArrival,
    getFurnitureAvailability,
    scanFurniture
};