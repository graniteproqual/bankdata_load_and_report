
const fs      = require( 'fs-jetpack');
const util    = require( 'util');

const jsonParseAsync = require( './jsonparseasync');

module.exports = function( sinceDateFile) {
  console.log( `Initializing sinceDate utils object with ${ sinceDateFile}`);
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
        console.log(util.inspect(err));
      });
    },
    "write": () => {
      "use strict";
      console.log('getSinceDate');
    }
  }
};
