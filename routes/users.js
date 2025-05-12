const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById,
    assignRole,
    deactivateUser,
    activateUser,
    logout
} = require('../controllers/userController');
const { authMiddleware, permissions } = require('../middleware/authMiddleware');
const { logActions } = require('../middleware/loggingMiddleware');

// Публичные маршруты
router.post('/register', logActions.userCreated, registerUser);
router.post('/login', logActions.userLogin, loginUser);

// Защищенные маршруты - требуют аутентификацию
router.use(authMiddleware);

// Профиль пользователя
router.get('/profile', getProfile);
router.patch('/profile', logActions.userUpdated, updateProfile);
router.post('/logout', logActions.userLogout, logout);

// Админские маршруты
router.get('/', permissions.canManageUsers, getAllUsers);
router.get('/:id', permissions.canManageUsers, getUserById);
router.patch('/:id/role', permissions.canAssignRoles, logActions.roleAssigned, assignRole);
router.patch('/:id/deactivate', permissions.canManageUsers, logActions.userDeleted, deactivateUser);
router.patch('/:id/activate', permissions.canManageUsers, logActions.userUpdated, activateUser);

module.exports = router;