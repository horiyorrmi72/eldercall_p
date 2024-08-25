require('dotenv').config();
const express = require('express');
const passport = require('passport');
const passportConfig = require('./config/passport');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const logger = require('morgan');
const router = require('./routes');
const connectDb = require('./config/db');
const cors = require('cors');
const MongoStore = require('connect-mongo');

const app = express();

const PORT = process.env.PORT || 3000;
// app.set('trust proxy', true);
// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.db_url,
      collectionName: 'sessions',
    }),
  })
);
app.use(cors());

// Initializing Passport
app.use(passport.initialize());

// Configure Passport
passportConfig(passport);

app.use('/', router);

// Connecting to the database
connectDb();

app.listen(PORT, () => {
  /* eslint-disable-next-line no-console*/
  console.log(`Listening on port ${PORT}`);
});

module.exports = app;
