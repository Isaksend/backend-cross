const Warehouse = require('../models/Warehouse');
const Furniture = require('../models/Furniture');
const { logError } = require('../middleware/loggingMiddleware');

// Создать новый склад
const createWarehouse = async (req, res) => {
    try {
        const warehouseData = {
            ...req.body,
            manager: req.body.managerId
        };

        const warehouse = new Warehouse(warehouseData);
        await warehouse.save();

        await warehouse.populate('manager', 'fullName email');

        res.status(201).json(warehouse);
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Получить все склады
const getAllWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find({ isActive: true })
            .populate('manager', 'fullName email')
            .populate('furniture.furnitureId', 'name description');

        res.json(warehouses);
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

// Получить склад по ID
const getWarehouseById = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id)
            .populate('manager', 'fullName email')
            .populate('furniture.furnitureId');

        if (!warehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        res.json(warehouse);
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

// Обновить склад
const updateWarehouse = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'location', 'capacity', 'manager', 'isActive'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Недопустимые обновления' });
        }

        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        updates.forEach(update => warehouse[update] = req.body[update]);
        await warehouse.save();

        await warehouse.populate('manager', 'fullName email');

        res.json(warehouse);
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Удалить склад
const deleteWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        // Мягкое удаление
        warehouse.isActive = false;
        await warehouse.save();

        res.json({ message: 'Склад успешно удален' });
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

// Добавить мебель на склад
const addFurniture = async (req, res) => {
    try {
        const { furnitureId, quantity } = req.body;
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        // Проверяем существование мебели
        const furniture = await Furniture.findById(furnitureId);
        if (!furniture) {
            return res.status(404).json({ message: 'Предмет мебели не найден' });
        }

        await warehouse.addFurniture(furnitureId, quantity);
        await warehouse.populate('furniture.furnitureId', 'name description');

        res.json(warehouse);
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Убрать мебель со склада
const removeFurniture = async (req, res) => {
    try {
        const { furnitureId, quantity } = req.body;
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        await warehouse.removeFurniture(furnitureId, quantity);
        await warehouse.populate('furniture.furnitureId', 'name description');

        res.json(warehouse);
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Перенести товар между складами
const transferStock = async (req, res) => {
    try {
        const { fromWarehouseId, toWarehouseId, furnitureId, quantity } = req.body;

        const fromWarehouse = await Warehouse.findById(fromWarehouseId);
        const toWarehouse = await Warehouse.findById(toWarehouseId);

        if (!fromWarehouse || !toWarehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        // Удаляем с исходного склада
        await fromWarehouse.removeFurniture(furnitureId, quantity);

        // Добавляем на целевой склад
        await toWarehouse.addFurniture(furnitureId, quantity);

        res.json({
            message: 'Товар успешно перемещен',
            fromWarehouse: fromWarehouse._id,
            toWarehouse: toWarehouse._id,
            furnitureId,
            quantity
        });
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Получить отчет по складу
const getStockReport = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id)
            .populate('furniture.furnitureId');

        if (!warehouse) {
            return res.status(404).json({ message: 'Склад не найден' });
        }

        const report = {
            warehouseName: warehouse.name,
            totalCapacity: warehouse.capacity,
            currentStock: warehouse.currentStock,
            utilizationPercentage: (warehouse.currentStock / warehouse.capacity) * 100,
            items: warehouse.furniture.map(item => ({
                furniture: item.furnitureId,
                quantity: item.quantity,
                lastUpdated: item.lastUpdated
            }))
        };

        res.json(report);
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createWarehouse,
    getAllWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse,
    addFurniture,
    removeFurniture,
    transferStock,
    getStockReport
};