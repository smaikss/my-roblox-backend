const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();

// Налаштування для Render, щоб він правильно визначав IP користувача через проксі-сервери
app.set('trust proxy', true);

const MONGO_URI = "mongodb+srv://vladkashukvlad100:VLZ01ASq@cluster0.w6fqbcv.mongodb.net/keys_database?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Додаємо поле userIP у схему
const KeySchema = new mongoose.Schema({
    keyString: String,
    userIP: String, // Зберігатимемо тут IP
    createdAt: { type: Date, default: Date.now, expires: 86400 } 
});
const Key = mongoose.model('Key', KeySchema);

app.get('/generate', async (req, res) => {
    try {
        // Отримуємо IP-адресу користувача
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Шукаємо, чи є вже активний ключ для цього IP
        const existingKey = await Key.findOne({ userIP: ip });

        if (existingKey) {
            // Якщо ключ знайдено — віддаємо СТАРИЙ ключ
            return res.send(`<h1>Your Key: ${existingKey.keyString}</h1><p>This key is already generated for your IP. Expires in 24h</p>`);
        }

        // Якщо ключа немає — генеруємо НОВИЙ
        const newKey = "OAK-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        
        // Зберігаємо ключ разом з IP в базу
        await Key.create({ 
            keyString: newKey,
            userIP: ip 
        });

        res.send(`<h1>Key: ${newKey}</h1><p>Expires in 24h</p>`);
    } catch (e) { 
        console.error(e);
        res.status(500).send("DB Error: " + e.message); 
    }
});

app.get('/check', async (req, res) => {
    try {
        const found = await Key.findOne({ keyString: req.query.key });
        res.send(found ? "VALID" : "INVALID");
    } catch (e) {
        res.status(500).send("Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
