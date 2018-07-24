import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider
} from '../../shared/ReactTypeOfWork';
import { popHostContainer, popHostContext } from './ReactFiberHostContext';
import { markLegacyErrorBoundaryAsFailed, onUncatchError } from './ReactFiberScheduler';

import {
  popContextProvider as popLegacyContextProvider,
  popTopLevelContextObject as popTopLevelLegacyContextObject
} from './ReactFiberContext';

import { popProvider } from './ReactFiberNewContext';
import { createUpdate, CaptureUpdate } from './ReactUpdateQueue';
import { enableGetDerivedStateFromCatch } from '../../shared/ReactFeatureFlags';
import { logError } from './ReactFiberCommitWork';

function unwindInterruptedWork(interruptedWork) {
  switch (interruptedWork.tag) {
    case ClassComponent:
      popLegacyContextProvider(interruptedWork); // 是否是父组件的props
      break;
    case HostRoot:
      popHostContainer();
      popTopLevelLegacyContextObject();
      break;
    case HostComponent:
      popHostContext(interruptedWork);
      break;
    case HostPortal:
      popHostContainer();
      break;
    case ContextProvider:
      popProvider();
      break;
    default:
      break;
  }
}
/**
 * 
 * @param {fiber} fiber fiber对象 
 * @param {object} errorInfo 错误信息对象: {value: string}, {source: fiber}, {stack: string}
 * @param {number} expirationTime 
 */
function createClassErrorUpdate(fiber, errorInfo, expirationTime) {
  const update = createUpdate(expirationTime);
  update.tag = CaptureUpdate;
  const getDerivedStateFromCatch = fiber.type.getDerivedStateFromCatch;
  if (
    enableGetDerivedStateFromCatch &&
    typeof getDerivedStateFromCatch === 'function'
  ) {
    const error = errorInfo.value;
    update.payload = () => getDerivedStateFromCatch(error);
  }

  // 获取上一个组件的实例,备份的.
  const inst = fiber.stateNode;
  if (inst !== null && typeof inst.componentDidCatch === 'function') {
    update.callback = function callback() {
      if (
        !enableGetDerivedStateFromCatch ||
        typeof getDerivedStateFromCatch !== 'function'
      ) {
        // 在进入浏览器之前,标记错误边界
        markLegacyErrorBoundaryAsFailed(this);
      }
      const error = errorInfo.value;
      const stack = errorInfo.stack;
      logError(fiber, errorInfo);
      this.componentDidCatch(error, {
        componentStack: stack !== null ? stack : ''
      });
    };
  }
  return update;
}

function createRootErrorUpdate(fiber, errorInfo, expirationTime) {
  const update = createUpdate(expirationTime);
  // 错误标签
  update.tag = CaptureUpdate;
  update.payload = {
    element: null
  };
  const error = errorInfo.value;
  update.callback = () => {
    onUncatchError(error);
    logError(fiber, errorInfo);
  };
  return update;
}

function throwException() {}
export { unwindInterruptedWork, throwException, createClassErrorUpdate, createRootErrorUpdate };
