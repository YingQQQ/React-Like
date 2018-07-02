// React Fiber 等待的优先级

/**
 * 给等待的子代标记优先级
 * @param {Vnode} root 虚拟DOM对象 
 * @param {number} expirationTime 阶段等级
 */
export function markPendingPriorityLevel(root, expirationTime) {
  console.log(expirationTime);
}

export function markCommittedPriorityLevels() {}
