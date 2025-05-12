const express = require('express');
const router = express.Router();
const {
    createWarehouse,
    getAllWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse,
    addFurniture,
    removeFurniture,
    transferStock,
    getStockReport
} = require('../controllers/warehouseController');
const { authMiddleware, permissions } = require('../middleware/authMiddleware');
const { logActions } = require('../middleware/loggingMiddleware');

// Все маршруты складов требуют аутентификации
router.use(authMiddleware);

// Создать склад (admin only)
router.post('/', permissions.canManageWarehouses, logActions.warehouseCreated, createWarehouse);

// Получить все склады
router.get('/', permissions.canViewWarehouses, getAllWarehouses);

// Получить склад по ID
router.get('/:id', permissions.canViewWarehouses, getWarehouseById);

// Обновить склад (admin only)
router.patch('/:id', permissions.canManageWarehouses, logActions.warehouseUpdated, updateWarehouse);

// Удалить склад (admin only)
router.delete('/:id', permissions.canManageWarehouses, logActions.warehouseDeleted, deleteWarehouse);

// Добавить мебель на склад (admin, moderator)
router.post('/:id/furniture', permissions.canAddFurniture, logActions.furnitureAdded, addFurniture);

// Убрать мебель со склада (admin, moderator)
router.delete('/:id/furniture', permissions.canModifyFurniture, removeFurniture);

// Перенести товар между складами (admin, moderator)
router.post('/transfer', permissions.canModifyFurniture, logActions.stockTransfer, transferStock);

// Получить отчет по складу
router.get('/:id/report', permissions.canViewWarehouses, getStockReport);

module.exports = router;