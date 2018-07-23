import getStackAddendumByWorkInProgressFiber from '../../shared/ReactFiberComponentTreeHook';

/**
 * 捕获错误
 * @param {string | any} value 
 * @param {Fiber} source 
 */
export default function ReactCapturedValue(value, source) {
  return {
    value,
    source,
    stack: getStackAddendumByWorkInProgressFiber(source)
  };
}
