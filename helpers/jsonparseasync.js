//make json.parse into a promise
const Promise = require( 'bluebird');
module.exports = (data) => {
  return new Promise((resolve, reject) => {
    try {
      let obj = JSON.parse(data);
      resolve(obj);
    }
    catch (err) {
      reject(err);
    }
  })
};