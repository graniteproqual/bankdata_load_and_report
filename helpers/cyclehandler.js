// cycleHandler (.js)
'use strict';
module.exports = ( limit, everyCycle = ()=>{}, atLimit = ()=>{}) => {
  let cycle = 0;
  let retval = false;
  function cycleCheck() {
    cycle += 1;
    console.log( 'limit: ' + limit);
    console.log( 'cycle: ' + cycle);
    if (cycle >= limit) {
      console.log( 'At limit');
      cycle = 0;
      retval = true;
      atLimit( cycle);
    } else {
      console.log( 'Every Cycle');
      retval = false;
      everyCycle( cycle);
    }
    return( retval);
  }
  return cycleCheck;
};
