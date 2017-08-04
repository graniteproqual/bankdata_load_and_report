'use strict';
const express         = require('express');
const path            = require('path');
const favicon         = require('serve-favicon');
const logger          = require('morgan');
const cookieParser    = require('cookie-parser');
const bodyParser      = require('body-parser');
const sassMiddleware  = require('node-sass-middleware');

const index           = require('./cdr_getdata_server/routes/index');
const users           = require('./cdr_getdata_server/routes/users');

const soap = require( 'strong-soap').soap;
const wsdl = 'https://cdr.ffiec.gov/public/pws/webservices/retrievalservice.asmx?WSDL';

const sinceDateUtils = require( './helpers/sincedate')( 'status/since_date.json');

const cycleHandler    = require( './helpers/cyclehandler.js');
const settings        = require( './config/settings.json');

//cycleHandler( limit = 50, everyCycle = ()=>{}, atLimit = ()=>{}) => {...}
const cycleCheck      = cycleHandler(
  4,()=>{},()=>{console.log( 'reached limit, recycling')} // callback on limit
);

console.log( `settings interval ${settings.interval}`);

setInterval(function () {
  cycleCheck();
  (sinceDateUtils.read())
  .then(( sinceDate)=> {
    console.log( 'returned: ' + sinceDate);
  })
}, settings.interval);

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'cdr_getdata_server', 'views'));
app.set('view engine', 'pug');


app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
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
