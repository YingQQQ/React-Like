/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
const valueStack = [];
let index = -1;

function pop(cursor) {
  if (index < 0) {
    return;
  }

  cursor.current = valueStack[index];
  valueStack[index] = null;

  index--;
}


function createCursor(defaultValue) {
  return {
    current: defaultValue
  };
}


export {
  pop,
  createCursor
};
