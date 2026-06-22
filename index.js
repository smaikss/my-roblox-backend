const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();

app.set('trust proxy', true);

const MONGO_URI = "mongodb+srv://vladkashukvlad100:VLZ01ASq@cluster0.w6fqbcv.mongodb.net/keys_database?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const KeySchema = new mongoose.Schema({
    keyString: String,
    userIP: String,
    createdAt: { type: Date, default: Date.now, expires: 86400 } 
});
const Key = mongoose.model('Key', KeySchema);

app.get('/generate', async (req, res) => {
    try {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // 1. Спочатку перевіряємо, чи є вже активний ключ для цього IP
        const existingKey = await Key.findOne({ userIP: ip });

        if (existingKey) {
            // Якщо ключ є — повертаємо його (дозволяємо оновлювати сторінку протягом 24 годин)
            return res.send(`<h1>Your Key: ${existingKey.keyString}</h1><p>This key is already generated for your IP. Expires in 24h</p>`);
        }

        // 2. ЗАХИСТ: Якщо ключа для IP немає, перевіряємо, звідки прийшла людина
        const referer = req.headers.referer || req.headers.referrer;

        // Перевіряємо, чи є в реферері слово "linkvertise.com"
        const cameFromLinkvertise = referer && referer.includes('linkvertise.com');

        if (!cameFromLinkvertise) {
            // Якщо людина зайшла за збереженим посиланням або вставила його вручну
            return res.status(403).send(`
                <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1 style="color: red;">Помилка доступу (Access Denied)</h1>
                    <p>Ви намагалися зайти на пряме посилання без виконання завдання.</p>
                    <p>Щоб отримати ключ, пройдіть через наше офіційне посилання на <b>Linkvertise</b>!</p>
                </div>
            `);
        }

        // 3. Якщо перевірку пройдено (людина реально з Linkvertise) — генеруємо новий ключ
        const newKey = "OAK-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        
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
