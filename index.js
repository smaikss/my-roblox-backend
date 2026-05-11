const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();

const MONGO_URI = "mongodb+srv://vladkashukvlad100:VLZ01ASq@cluster0.w6fqbcv.mongodb.net/keys_database?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(() => console.log("✅ MongoDB Connected"));

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
    } catch (e) { res.status(500).send("DB Error"); }
});

app.get('/check', async (req, res) => {
    const found = await Key.findOne({ keyString: req.query.key });
    res.send(found ? "VALID" : "INVALID");
});

app.listen(process.env.PORT || 3000);
