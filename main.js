const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // path module for static files

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // for POST JSON
app.use(express.static(path.join(__dirname, 'public'))); // serve static files

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index2.html'));
console.log("done");
});


// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/myride', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Example: location schema & model
const locationSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: { type: Date, default: Date.now },
    userAgent: String
});
const Location = mongoose.model('Location', locationSchema);

// POST endpoint to save location
app.post('/api/location', async (req, res) => {
    console.log("API called");

    try {
        const { latitude, longitude, accuracy, userAgent } = req.body;

        // ✅ Server time (UTC) le lo
        const serverTimeUTC = new Date();

        // ✅ Optional: Malaysia time (UTC+8)
        const malaysiaTime = new Date(serverTimeUTC.getTime() + (8 * 60 * 60 * 1000));

        // ✅ Store both times if you want traceability
        const loc = new Location({
            latitude,
            longitude,
            accuracy,
            userAgent,
            serverTimeUTC,
            malaysiaTime
        });

        await loc.save();

        res.json({
            success: true,
            message: 'Location saved with server time',
            serverTimeUTC,
            malaysiaTime
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// GET route example (optional)
// If you want /welcome.html or other pages handled via GET
app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.listen(5000, () => console.log('Server running on port 5000'));
