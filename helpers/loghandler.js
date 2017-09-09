"use strict";
const moment    = require( 'moment');
module.exports = ( msg, severity="info")=>{
   console.log( `${moment()} | ${severity} | ${msg}`)
}