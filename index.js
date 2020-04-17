const express = require('express');
require('dotenv/config');
const config = require('config');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');





// Passport config
require('./config/passport')(passport);


// Initialize express session middleware
app.use(express.json({extended: false}));
app.use(cors());
app.use(session({
    secret: config.get('HIDDEN_SECRET'),
    resave: true,
    saveUninitialized: true
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})




// Connect Database
connectDB();

// Routes initialized

const User = require('./Routes/user');
const Bar = require('./Routes/bar');
const Order = require('./Routes/order');
const BarOwner = require('./Routes/barConfirmation');


app.use('/User', User);
app.use('/Bar', Bar);
app.use('/Order', Order);
app.use('/BarOwner', BarOwner);


// Start server on port

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});