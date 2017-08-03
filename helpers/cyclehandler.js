// cycleHandler (.js)
'use strict';
module.exports = ( limit, callback = ()=>{}) => {
  let cycle = 0;
  let retval = false;
  function cycleCheck() {
    cycle += 1;
    if (cycle >= limit) {
      cycle = 0;
      retval = true;
      callback( cycle);
    } else {
      retval = false;
    }
    return( retval);
  }
  return cycleCheck;
};
