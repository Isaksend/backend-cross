const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logError } = require('../middleware/loggingMiddleware');

// Регистрация пользователя
const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Проверяем, существует ли пользователь с таким email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Создаем нового пользователя
        const userData = { fullName, email, password };

        // Только админ может устанавливать роль при регистрации
        if (req.user && req.user.role === 'admin' && role) {
            userData.role = role;
        }

        const user = await User.create(userData);

        // Создаем JWT токен
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        // Отправляем успешный ответ (без пароля)
        const userResponse = {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };

        res.status(201).json({ user: userResponse, token });
    } catch (error) {
        await logError(error, req);
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Вход пользователя
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Находим пользователя по email
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Проверяем пароль
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Создаем JWT токен
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        // Отправляем успешный ответ с токеном и информацией о пользователе
        res.status(200).json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        await logError(error, req);
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Получить профиль текущего пользователя
const getProfile = async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role,
            createdAt: req.user.createdAt
        }
    });
};

// Обновить профиль пользователя
const updateProfile = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['fullName', 'email', 'password'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();

        res.json({
            user: {
                id: req.user._id,
                fullName: req.user.fullName,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Получить всех пользователей (только админ)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isActive: true })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

// Получить пользователя по ID (только админ)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

// Назначить роль (только админ)
const assignRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!['admin', 'manager', 'moderator'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        user.role = role;
        await user.save();

        res.json({
            message: 'Role assigned successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Деактивировать пользователя (только админ)
const deactivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Запрет на самодеактивацию
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot deactivate yourself' });
        }

        user.isActive = false;
        await user.save();

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Активировать пользователя (только админ)
const activateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = true;
        await user.save();

        res.json({ message: 'User activated successfully' });
    } catch (error) {
        await logError(error, req);
        res.status(400).json({ message: error.message });
    }
};

// Выход
const logout = async (req, res) => {
    try {
        // В production-приложении можно добавить blacklist токенов
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        await logError(error, req);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
};