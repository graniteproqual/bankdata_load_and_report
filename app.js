'use strict';
const express         = require( 'express');
const util            = require( 'util');
const path            = require( 'path');
const favicon         = require( 'serve-favicon');
const logger          = require( 'morgan');
const cookieParser    = require( 'cookie-parser');
const bodyParser      = require( 'body-parser');
const sassMiddleware  = require( 'node-sass-middleware');
const soap            = require( 'soap');
const fs              = require( 'fs-jetpack');
const Promise         = require( 'bluebird');
const _               = require( 'lodash');

const index  = require( './cdr_getdata_server/routes/index');
const users  = require( './cdr_getdata_server/routes/users');

const wsdl   = 'https://cdr.ffiec.gov/public/pws/webservices/retrievalservice.asmx?WSDL';

const sinceDateUtils  = require( './helpers/sincedate')( './status/since_date.json');
const cycleHandler    = require( './helpers/cyclehandler.js');
const log             = require( './helpers/loghandler.js');
const filersFromFile  = require( './helpers/filersforuseuntilwecanaccesscdr.json');
const xbrlfile2Json   = require( './helpers/xbrlfile2json');
const jsonParseAsync  = require( './helpers/jsonparseasync');
const bankData        = require( './cdr_getdata_server/models/bankdatamodel')();

const settings                 = require( './config/settings.json');

//const downloadedInstanceDocsLocation = path.join( __dirname, settings.data, 'xbrl-in') + '/';
const downloadedInstanceDocsLocation = settings.data + 'xbrl-in/';
const processedInstanceDocsLocation = settings.data + 'xbrl-processed/';
//cycleHandler( limit = 50, everyCycle = ()=>{}, atLimit = ()=>{}) => {...}
const cycleCheck      = cycleHandler(
  4,()=>{},()=>{log( 'reached limit, recycling')} // callback on limit
);

log( `settings interval ${settings.interval}`);

let options = {};
const dataSeries = 'Call';
let soapClient = {};
let maxFilesOpen = 100;
let filesOpen = 0;

//===========================================================================
soap.createClientAsync(settings.cdrUrl, {forceSoap12Headers: true})
  .then( (client)=> {
    soapClient = client;
    log(`have a soapClient working against ${settings.cdrUrl}`);
    return( client)
  })
  .then((client)=>{  // to learn how createClientAsync works
    let res = [];
      for(var m in soapClient) {
        if(typeof soapClient[m] == "function") {
          res.push(m)
        }
      };
    log(`soapClient methods: ${res}`);
    return(client) /*( soapClient.describeAsync())*/;     //describe());
  })
  .then((client)=>{
    log( 'prep security configuration on client');
    let options={};
    return(new soap.BasicAuthSecurity(settings.cdrUserName, settings.cdrPassword));
  })
  .then((wsSecurityConfig)=> {
    log( `wsSecurityConfig: ${wsSecurityConfig}` );
    return (soapClient.setSecurity(wsSecurityConfig));
  })
  .then(()=> {
    log( 'startng interval timer');
    setInterval(function loadAllCallReports() {
    cycleCheck();
    sinceDateUtils.read()
    .then((sinceDate) => {
      log( `Have sinceDate`);
      log( `Looking for instance docs here: ${downloadedInstanceDocsLocation}`);
      fs.findAsync(downloadedInstanceDocsLocation, {matching: "FFIEC*"})
        .then((ra) => {
          log( 'Have an array of length: ' + ra.length );
          if (ra && (ra.length > 0)) {
            log( `found matching Call Reports: ${ra.length}`);
            let allPromises = ra.map((aCallReportFile) => {
              while( filesOpen > maxFilesOpen) { log( `Files Open: ${fileOpen}`)};
              filesOpen++;
              log( 'opening a file');
              let json = {};
  
              xbrlfile2Json(aCallReportFile)
                .then((jsonString) => {  //parse string into a json object
                  return( jsonParseAsync(jsonString));
                })
                .then((parsedJsonString) => {  // update database
                  json = parsedJsonString;
                  // let idrssd = _.get( json, 'xbrl.context[1].entity.identifier._text' );
                  // let cert   = _.get( json, 'xbrl.cc:RSSD9050._text');
                  // let period = _.get( json, 'xbrl.context[1].period.instant._text' );
                  return( bankData.writeBankInfo(json));
                })
                .then(()=>{
                log( 'writing to mongo db');
                  return( bankData.writeCallReport(json));
                })
                .then(()=>{
                log( `moving ${aCallReportFile} to: ${processedInstanceDocsLocation + aCallReportFile.split('\\').pop().split('/').pop()}`);
                  return(
                  fs.moveAsync( aCallReportFile, processedInstanceDocsLocation + aCallReportFile.split('\\').pop().split('/').pop())
                  );
                })
                .then( ()=>{filesOpen--;})
                .catch((err) => {
                  log(`Error on inserting in mongodb: ${util.inspect(err)}`);
                });
              });
            return ( Promise.all(allPromises));
          }
        })
        .catch((err) => {
          /* continue */
        })
      })
    .catch((err)=>{
      log( `Error in an interval: ${util.inspect(err)}`,'ERR');
    })
  return loadAllCallReports}(), settings.interval);
}).catch((err)=>{
  log( `Error on createClientAsync: ${util.inspect(err)}`,'ERR');
});

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
