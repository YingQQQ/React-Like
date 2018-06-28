import { createFiberRoot } from './ReactFiberRoot';
import getPublicInstance from './ReactFiberHostConfig';
import { HostComponent } from '../../shared/ReactTypeOfWork';
import {
  unbatchedUpdates
} from './ReactFiberScheduler';

/**
 * 进入fiber算法
 * @param {Element | Document} containerInfo  真实的DOM
 * @param {boolean} isAsync 是否进行异步渲染 
 * @param {boolean} hydrate 是否缓存属性 
 */
export function createContainer(containerInfo, isAsync, hydrate) {
  return createFiberRoot(containerInfo, isAsync, hydrate);
}

export function getPublicRootInstance(container) {
  const containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}

export {
  unbatchedUpdates
};
