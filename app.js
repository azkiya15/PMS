const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const Pool = require("pg").Pool;
const session = require("express-session");
const flash = require("connect-flash");

const pool = new Pool({
  user: "postgres",
    host: "localhost",
    database: "challenge21",
    password: "asecretthingthatnoonehastosee",
    port: 5432
  })
  console.log("Successful connection to the database");

const indexRouter = require('./routes/index')(pool);
const usersRouter = require('./routes/users')(pool);
const projectRouter = require('./routes/projects')(pool);
const membersRouter = require('./routes/members')(pool);
const issuesRouter = require('./routes/issues')(pool);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: "kiya", resave: true, cookie: {}, saveUninitialized: true}))
app.use(flash());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/projects', projectRouter);
app.use('/profile', indexRouter);
app.use('/projects/members', membersRouter);
app.use('/projects/issues', issuesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
