const express = require('express');
const connectDB = require('./config/db');
const app = express();




// Initialize middleware
app.use(express.json({extended: false}));


// Connect Database
connectDB();

// Start server on port

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});