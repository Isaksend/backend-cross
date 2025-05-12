const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');

dotenv.config();

// Подключение к базе данных
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Логирование запросов (опционально)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Маршруты
app.use('/api/furniture', require('./routes/furniture'));
app.use('/api/users', require('./routes/users'));
app.use('/api/warehouses', require('./routes/warehouse'));

// Базовый маршрут
app.get('/', (req, res) => {
    res.send('API работает');
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        message: err.message || 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 обработчик
app.use((req, res) => {
    res.status(404).json({ message: 'Маршрут не найден' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});