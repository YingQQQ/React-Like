/* eslint-disable  import/no-mutable-exports */
import ExecutionEnvironment from '../lib/ExecutionEnvironment';
import requestAnimationFrameForReact from './requestAnimationFrameForReact';

const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';
const localDate = Date;
const localSetTimeout = setTimeout;
const localClearTimeout = clearTimeout;

let now;
if (hasNativePerformanceNow) {
  now = function performanceNow() {
    return performance.now();
  };
} else {
  now = function DateNow() {
    return localDate.now();
  };
}

let scheduleWork;
let cancelScheduledWork;
// TODO: else 之后的逻辑
if (!ExecutionEnvironment.canUseDOM) {
  const timeoutIds = new Map();
  scheduleWork = function scheduleWorkCanUseDOM(callback, options) {
    const callbackConfig = {
      scheduleCallBack: callback,
      timeoutTime: 0,
      next: null,
      prev: null
    };

    const timeoutId = localSetTimeout(() => {
      callback({
        timeRemaining() {
          return Infinity;
        },
        didTimeout: false
      });
    });

    timeoutIds.set(callback, timeoutId);
    return callbackConfig;
  };

  cancelScheduledWork = function cancelScheduledWorkCanUseDOM(callbackId) {
    const callback = callbackId.scheduleCallBack;
    const timeoutId = timeoutIds.get(callback);
    timeoutIds.delete(callbackId);
    localClearTimeout(timeoutId);
  };
}

export { now, cancelScheduledWork, scheduleWork };
