import ExecutionEnvironment from '../lib/ExecutionEnvironment';

const localRequestAnimationFrame = requestAnimationFrame;

if (!ExecutionEnvironment.canUseDOM && typeof localRequestAnimationFrame !== 'function') {
  console.warn('React depends on requestAnimationFrame. Make sure that you load a polyfill in older browsers.');
}


export default localRequestAnimationFrame;
