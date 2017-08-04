// cycleHandler (.js)
'use strict';
module.exports = ( limit = 50, everyCycle = ()=>{}, atLimit = ()=>{}) => {
  let cycle = 0;
  let retval = false;
  function cycleCheck() {
    cycle += 1;
    if (cycle >= limit) {
      cycle = 0;
      retval = true;
      atLimit( cycle);
    } else {
      retval = false;
      everyCycle( cycle);
    }
    return( retval);
  }
  return cycleCheck;
};
