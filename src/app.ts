var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var options = require('../.conf.json').mysql;
var dbPool = require('./helpers/db').init("alchpool", options);
console.log(dbPool);

var routes = require('./routes/index');
var requests = require('./routes/requests');
var responses = require('./routes/responses');
var users = require('./routes/users');
var multimedia = require('./routes/multimedia');
var sessions = require('./routes/sessions');

var test = require('./routes/test');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// several routes
// - index
app.use('/', routes);
// - session
app.use('/api/sessions', sessions);
// - users
app.use('/api/users', users);
// - requests
app.use('/api/requests', requests);
// - responses
app.use('/api/responses', responses);
// - multimedia
app.use('/api/multimedia', multimedia);

// - test
app.use('/api/test', test);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err:any = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
