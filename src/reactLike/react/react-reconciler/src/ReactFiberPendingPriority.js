/* eslint-disable no-param-reassign */

/**
 * React Fiber 等待的优先级
*/

import { NoWork, Sync } from './ReactFiberExpirationTime';

/**
 * @param {FiberRoot import ./ReactFiberRoot } createFiberRoot函数返回的对象
 */
function findNextPendingPriorityLevel(root) {
  const earliestSuspendedTime = root.earliestSuspendedTime;
  const earliestPendingTime = root.earliestPendingTime;
  let nextExpirationTimeToWorkOn;
  let expirationTime;
  if (earliestSuspendedTime === NoWork) {
    // 说明没有需要被暂停的任务
    expirationTime = earliestPendingTime;
    nextExpirationTimeToWorkOn = earliestPendingTime;
  } else if (earliestPendingTime !== NoWork) {
    // 检查是否有未知的任务
    nextExpirationTimeToWorkOn = earliestPendingTime;
    expirationTime =
      earliestSuspendedTime < earliestPendingTime
        ? earliestSuspendedTime
        : earliestPendingTime;
  } else {
    // 如果有一个需要暂停处理的任务,那就先处理,否则那就继续下一个任务
    nextExpirationTimeToWorkOn = root.latestPendingTime;
    expirationTime = root.latestPendingTime;
  }

  if (root.didError) {
    // 如果有错误,则改为同步渲染
    expirationTime = Sync;
  }
  // 改变虚拟节点所处的任务阶段
  root.nextExpirationTimeToWorkOn = nextExpirationTimeToWorkOn;
  root.expirationTime = expirationTime;
}
/**
 * 给等待的子代标记优先级
 * @param {Vnode} root 虚拟DOM对象
 * @param {number} expirationTime 阶段等级
 */
export function markPendingPriorityLevel(root, expirationTime) {
  // 在渲染根节点失败之后和重新启动之前有空闲时间,则安排其他的更新,清除didError防止更新有充足的时间来进行
  root.didError = false;
  const earliestPendingTime = root.earliestPendingTime;

  // 更新最早的和最新的处理时间
  if (earliestPendingTime === NoWork) {
    // 没有其他等待处理的更新
    root.earliestPendingTime = expirationTime;
    root.latestPendingTime = expirationTime;
  } else if (earliestPendingTime > expirationTime) {
    // 最早需要被更新的级别
    root.earliestPendingTime = expirationTime;
  } else {
    const latestPendingTime = root.latestPendingTime;
    if (latestPendingTime < expirationTime) {
      // 最新需要被处理的级别
      root.latestPendingTime = expirationTime;
    }
  }
  findNextPendingPriorityLevel(root);
}

export function markCommittedPriorityLevels() {}
