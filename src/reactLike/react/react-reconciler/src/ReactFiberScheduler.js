let isUnbatchingUpdates = false;
let isBatchingUpdates = false;

export function unbatchedUpdates(fn, a) {
  if (isBatchingUpdates && !isUnbatchingUpdates) {
    isUnbatchingUpdates = true;
    try {
      return fn(a);
    } catch (error) {
      isUnbatchingUpdates = false;
    }
  }
  return fn(a);
}
