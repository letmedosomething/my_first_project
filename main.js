

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv=require ('dotenv');
dotenv.config(); 




const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));



// ✅ Use imported schema
const User = require("./scheema/user-data");

mongoose.set('strictQuery', true);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(' MongoDB connection error:', err));



// ✅ Register (store hashed password)
app.post('/register', async (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ ok: false, message: 'Missing' });

    const exists = await User.findOne({ name });
    if (exists) return res.status(409).json({ ok: false, message: 'User exists' });

    const hash = await bcrypt.hash(password, 10);
    await new User({ name, password: hash }).save();

    res.json({ ok: true, message: 'Registered' });
});

// ✅ Login (check and redirect client-side)
app.post('/login', async (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ ok: false, message: 'Missing' });

    const user = await User.findOne({ name });
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ ok: false, message: 'Invalid' });

    res.json({ ok: true, message: 'OK' });
});


app.post('/update-location', async (req, res) => {
    const { name, latitude, longitude, accuracy } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' 
        
    });

    user.latitude = latitude;
    user.longitude = longitude;
    user.accuracy = accuracy || null;
    user.userAgent = req.headers['user-agent'] || user.userAgent;
    await user.save();

    res.json({ ok: true, message: 'Location updated' });
});


// ✅ Serve welcome page
app.get('/info', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index2.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));






