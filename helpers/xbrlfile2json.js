//promisify xml-js.xml2json
'use strict';
const Promise = require( 'bluebird');
const fs      = require( 'fs-jetpack');
const convert = require( 'xml-js');
const log     = require( './loghandler');

module.exports = (xmlfile) => {
  return new Promise((resolve, reject) => {
    try {
      fs.readAsync( xmlfile)
      .then((xml)=> {
        let obj = convert.xml2json(xml, {compact: true, spaces: 2});
        resolve(obj);
      })
    }
    catch (err) {
      log( err, 'ERROR');
      reject(err);
    }
  })
};