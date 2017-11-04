//
'use strict';

const fs      = require( 'fs-jetpack');

const xbrlfile2Json   = require('../helpers/xbrlfile2json');
const jsonParseAsync  = require('../helpers/jsonparseasync');

let f = '../data/xbrl-in/Call_Cert16470_063017.XBRL';

xbrlfile2Json(f).then((jsonString)=>{
  fs.writeAsync( 'instance.json', jsonString);
  jsonParseAsync( jsonString)
});

