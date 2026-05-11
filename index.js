const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();

const MONGO_URI = "mongodb+srv://vladkashukvlad100:VLZ01ASq@cluster0.w6fqbcv.mongodb.net/keys_database?retryWrites=true&w=majority";

// Підключаємось до бази з обробкою помилок
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const KeySchema = new mongoose.Schema({
    keyString: String,
    createdAt: { type: Date, default: Date.now, expires: 86400 } 
});
const Key = mongoose.model('Key', KeySchema);

app.get('/generate', async (req, res) => {
    try {
        const newKey = "OAK-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        await Key.create({ keyString: newKey });
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
