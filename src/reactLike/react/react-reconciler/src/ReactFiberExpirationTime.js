/* eslint-disable no-bitwise */

// 未启动算法
export const NoWork = 0;
// 同步标记
export const Sync = 1;

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = 2;

// 1表示经过10ms
export function msToExpirationTime(ms) {
  // 默认一个值,这样不会和NoWork冲突
  return ((ms / UNIT_SIZE) | 0) + MAGIC_NUMBER_OFFSET;
}

function ceiling(num, precision) {
  return (((num / precision) | 0) + 1) * precision;
}

export function computeExpirationBucket(
  currentTime,
  expirationMs,
  bucketSizeMs
) {
  return (
    MAGIC_NUMBER_OFFSET +
    ceiling(
      ((currentTime - MAGIC_NUMBER_OFFSET) + expirationMs) / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE
    )
  );
}
