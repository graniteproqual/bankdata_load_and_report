'use strict';
const bankInfo   = require( './bankdataschema').bankInfo;
const callReport = require( './bankdataschema').callReport;
const Promise    = require( 'bluebird');
const mongoose   = require( 'mongoose');
mongoose.Promise = Promise.Promise ;

const _       = require( 'lodash');

module.exports = function( connection = 'mongodb://localhost:27017') {
  mongoose.connect(connection, {useMongoClient: true});  // useMongoClient for mongoos >= 4.11.0
  return {
    writeBankInfo: (callReportJSON) => {
  
      let idrssd = _.get( callReportJSON, 'xbrl.context[1].entity.identifier._text'); console.log(`idrssd: ${idrssd}`);
      let cert   = _.get( callReportJSON, 'xbrl.cc:RSSD9050._text'); console.log(`cert: ${cert}`);
  
      bankInfo.findOneAndUpdate(
        {
          _id:    idrssd
        },
        {
          $setOnInsert: {
            _id: idrssd, cert: cert
          },
           $set: {
             instName:     '',
             instAddress:  '',
             instCity:     '',
             instState:    '',
             instZip:      ''
          }
        },
        {
          upsert: true,
          new: true
        },
        function (err,doc) {
          if (err) {
            console.log( err);
          } else {
            doc.save();
          }
        }
      );
    },
    writeCallReport: (callReportJSON) => {
  
     // // "context": [
     //   {
     //     "_attributes": { "id": "CI_45560_2017-06-30" },
     //     "entity": {
     //       "identifier": {
     //         "_attributes": { "scheme": "http://www.ffiec.gov/cdr" },
     //         "_text": "45560"
     //       }
     //     },
     //     "period": {
     //       "instant": {
     //         "_text": "2017-06-30"
     //       }
     //     }
     //   },...]
      let idrssd = _.get( callReportJSON, 'xbrl.context[0].entity.identifier._text');
      let period = _.get( callReportJSON, 'xbrl.context[0].period.instant._text');
      
      callReport.findOneAndUpdate(
        {
          idrssd:  idrssd,
          period:  period
        },
        {
          $setOnInsert: { idrssd: idrssd, period: period},
          $set:         {callReport: callReportJSON}
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        },
        function (err,doc) {
          if (err) {
            console.log( err);
          } else {
            doc.save();
          }
        }
      );
    },
  }
};