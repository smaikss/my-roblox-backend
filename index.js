const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// База даних ключів (в пам'яті сервера)
// expires: null — вічний ключ, або дата (timestamp) коли ключ згорить
let keys = {
    "PERM-123": { expires: null }, // Вічний ключ
    "TEMP-456": { expires: Date.now() + (24 * 60 * 60 * 1000) }, // На 24 години
    "TRIAL-789": { expires: Date.now() + (1 * 60 * 60 * 1000) }  // На 1 годину
};

app.get('/check', (req, res) => {
    const userKey = req.query.key;

    if (!userKey || !keys[userKey]) {
        return res.send("INVALID");
    }

    const keyData = keys[userKey];

    // Перевірка на час дії
    if (keyData.expires !== null && Date.now() > keyData.expires) {
        delete keys[userKey]; // Видаляємо ключ, якщо час вийшов
        return res.send("EXPIRED");
    }

    res.send("VALID");
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});