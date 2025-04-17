const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Регистрация пользователя
const registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Проверяем, существует ли пользователь с таким email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Хешируем пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Создаем нового пользователя
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword
        });

        // Отправляем успешный ответ (без пароля)
        const userResponse = {
            id: user._id,
            fullName: user.fullName,
            email: user.email
        };

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Вход пользователя
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Находим пользователя по email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Создаем JWT токен
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key', // Используйте переменную окружения
            { expiresIn: '24h' }
        );

        // Отправляем успешный ответ с токеном и информацией о пользователе
        res.status(200).json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = {
    registerUser,
    loginUser
};