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

// Маршруты
app.use('/api/furniture', require('./routes/furniture'));
app.use('/api/users', require('./routes/users'));
// Базовый маршрут
app.get('/', (req, res) => {
    res.send('API работает');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});