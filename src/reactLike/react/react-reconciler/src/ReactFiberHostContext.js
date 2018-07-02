import { pop, createCursor } from "./ReactFiberStack";

const NO_CONTEXT = {};

let contextStackCursor = createCursor(NO_CONTEXT);
let contextFiberStackCursor = createCursor(NO_CONTEXT);
let rootInstanceStackCursor  = createCursor(NO_CONTEXT);

function popHostContainer() {
  pop(contextStackCursor);
  pop(contextFiberStackCursor);
  pop(rootInstanceStackCursor);
}

function popHostContext(fiber) {
  if (contextFiberStackCursor.current !== fiber) {
    return;
  }
  pop(contextStackCursor);
  pop(contextFiberStackCursor);
}

export {
  popHostContainer,
  popHostContext
}
