
const fs     = require( 'fs-jetpack');
const util   = require( 'util');

const jsonParseAsync = require( './jsonparseasync');
const log            = require( './loghandler');

module.exports = function( sinceDateFile) {
  log( `Initializing sinceDate utils object with ${ sinceDateFile}`);
  return {
    "read": () => {
      return (fs.readAsync(sinceDateFile, 'utf8'))
      .then((data) => {
        return ( jsonParseAsync(data));
      })
      .then((json) => {
        return (json.sincedate);
      })
      .catch((err) => {
        log(util.inspect(err), 'ERROR');
      });
    },
    "write": () => {
      "use strict";
      log('getSinceDate');
    }
  }
};
