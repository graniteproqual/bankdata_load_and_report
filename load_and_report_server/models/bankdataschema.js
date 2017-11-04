const mongoose = require('mongoose');
mongoose.Promise = require( 'bluebird').Promise ; //require( 'bluebird');
const Schema = mongoose.Schema;

// _id will hold leading zero filled idrssd
let bankInfoSchema = new Schema({
  _id:          {type: String, required: true},
  cert:         {type: String, required: true, unique: true},
  instName:     {type: String, required: false},
  instAddress:  {type: String, required: false},
  instCity:     {type: String, required: false},
  instState:    {type: String, required: false},
  instZip:      {type: String, required: false}
});
//bankInfoSchema.index({cert: 1});  // index to quickly find cert,
                                  // then use bankInfo _id (which is really idrssd) to find bankCall document(s)

let bankCallSchema = new Schema({
  idrssd:     {type: String, required: true},
  period:     {type: String, required: true},
  callReport: {type: Object, required: true}
});
bankCallSchema.index({_idrssd: 1, callDate: -1});  // "best" sort order for a banks instance docs, latest inance doc first

exports.bankInfo = mongoose.model('bankInfo', bankInfoSchema);
exports.callReport = mongoose.model('callReport', bankCallSchema);