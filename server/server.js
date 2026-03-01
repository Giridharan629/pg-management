const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Initialize DB
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Mount Routes
app.use('/api/tenant', require('./routes/tenantRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong on the server!' });
});

app.get('/', (req, res)=>{
    res.send({"status" : "running", "message" : "api working fine"});
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});