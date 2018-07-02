/* eslint-disable no-underscore-dangle */
import { createCursor, pop } from './ReactFiberStack';
import { isPrimaryRenderer } from './ReactFiberHostConfig';

const changedBitsCursor = createCursor(0);
const valueCursor = createCursor(null);
const providerCursor = createCursor(null);

function popProvider() {
  const changedBits = changedBitsCursor.current;
  const currentValue = valueCursor.current;
  pop(providerCursor);
  pop(valueCursor);
  pop(changedBitsCursor);

  const context = providerCursor.type._context;

  if (isPrimaryRenderer) {
    context._currentValue = currentValue;
    context._changedBits = changedBits;
  } else {
    context._currentValue2 = currentValue;
    context._changedBits2 = changedBits;
  }
}

function pushProvider() {}

export { popProvider, pushProvider };
