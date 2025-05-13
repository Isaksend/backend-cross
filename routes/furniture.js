const express = require('express');
const router = express.Router();
const {
    getFurniture,
    getFurnitureById,
    createFurniture,
    updateFurniture,
    deleteFurniture,
    sellFurniture,
    registerArrival,
    getFurnitureAvailability,
    scanFurniture
} = require('../controllers/furnitureController');
const { authMiddleware, permissions } = require('../middleware/authMiddleware');
const { logActions } = require('../middleware/loggingMiddleware');

// Все маршруты мебели требуют аутентификации
router.use(authMiddleware);

// Получить все предметы мебели
router.get('/', getFurniture);

router.post('/scan', scanFurniture);

// Получить конкретный предмет мебели
router.get('/:id', getFurnitureById);

// Получить доступность мебели по складам
router.get('/:id/availability', getFurnitureAvailability);

// Создать мебель (admin, moderator)
router.post('/', permissions.canAddFurniture, logActions.furnitureAdded, createFurniture);

// Обновить мебель (admin, moderator)
router.put('/:id', permissions.canModifyFurniture, logActions.furnitureUpdated, updateFurniture);

// Удалить мебель (admin only)
router.delete('/:id', permissions.canDeleteFurniture, logActions.furnitureDeleted, deleteFurniture);

// Продать мебель (admin, manager, moderator)
router.post('/:id/sell', permissions.canSellFurniture, logActions.furnitureSold, sellFurniture);

// Зарегистрировать поступление (admin, moderator)
router.post('/:id/arrival', permissions.canManageArrivals, logActions.furnitureArrival, registerArrival);

module.exports = router;