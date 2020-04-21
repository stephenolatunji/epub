const express = require('express');
require('dotenv').config();
const config = require('config');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');

app.use(cors());
app.options('*', cors());

// Initialize express session middleware
app.use(express.json());
app.use(express.static('assets'));

// Routes initialized
const User = require('./Routes/user');
const Bar = require('./Routes/bar');
const Order = require('./Routes/order');
const BarOwner = require('./Routes/barConfirmation');
const Admin = require('./Routes/admin');

app.use('/User', User);
app.use('/Bar', Bar);
app.use('/Order', Order);
app.use('/BarOwner', BarOwner);
app.use('/Admin', Admin);


// Start server on port
const port = process.env.PORT || 5000;

// Connect Database
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`)
    });
});