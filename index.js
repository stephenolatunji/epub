const express = require('express');
const config = require('config')
const app = express();
const connectDB = require('./config/db');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
// const passportLocal = require('passport-local');

// Passport config
require('./config/passport')(passport);


// Initialize express session middleware
app.use(express.json({extended: false}));
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

app.use('/User', User)


// Start server on port

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});