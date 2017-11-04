'use strict';
const express         = require( 'express');
const util            = require( 'util');
const path            = require( 'path');
const favicon         = require( 'serve-favicon');
const logger          = require( 'morgan');
const cookieParser    = require( 'cookie-parser');
const bodyParser      = require( 'body-parser');
const sassMiddleware  = require( 'node-sass-middleware');
const fs              = require( 'fs-jetpack');
const Promise         = require( 'bluebird');

const index  = require( './load_and_report_server/routes/index');
const users  = require( './load_and_report_server/routes/users');

const cycleHandler    = require( './helpers/cyclehandler.js');
const log             = require( './helpers/loghandler.js');
const xbrlfile2Json   = require( './helpers/xbrlfile2json');
const jsonParseAsync  = require( './helpers/jsonparseasync');
const bankData        = require( './load_and_report_server/models/bankdatamodel')();


const configFileLocations = require( './config/config_file_locations.json');
const sharedSettingsJson  = require( configFileLocations.shared_settings_json);
const settings            = require( configFileLocations.other_settings_json);

const downloadedInstanceDocsLocation = sharedSettingsJson.inst_doc_folder.replace('~',process.env['HOME']);
const processedInstanceDocsLocation  = sharedSettingsJson.processed_folder.replace('~',process.env['HOME']);
//cycleHandler( limit = 50, everyCycle = ()=>{}, atLimit = ()=>{}) => {...}
const cycleCheck      = cycleHandler(
  4,()=>{},()=>{log( 'reached limit, recycling')} // callback on limit
);

log( `settings interval ${settings.interval}`);

let maxFilesOpen = 100;
let filesOpen = 0; // throttle processing because we can easily get too many files open at the same time

//===========================================================================
//periodically process any recently downloaded instance documents
log( 'startng interval timer');
setInterval(function loadAllCallReports() {
  log( 'starting an interval');
  cycleCheck();
  log( `downloadedInstanceDocsLocation ${downloadedInstanceDocsLocation}`);
  fs.findAsync(downloadedInstanceDocsLocation, {matching: 'FFIEC*'})
  .then((ra) => {
  log( 'Have an array of length: ' + ra.length );
  if (ra && (ra.length > 0)) {
    log( `found matching Call Reports: ${ra.length}`);
    let allPromises = ra.map((aCallReportFile) => {
      while( filesOpen > maxFilesOpen) { log( `Files Open: ${filesOpen}`)}
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
    
    log(`Error on finding : ${downloadedInstanceDocsLocation} : ` + err);
  })
}, settings.interval);

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'load_and_report_server', 'views'));
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
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
