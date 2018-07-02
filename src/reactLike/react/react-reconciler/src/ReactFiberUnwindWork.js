import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostPortal,
  ContextProvider
} from '../../shared/ReactTypeOfWork';
import { popHostContainer, popHostContext } from './ReactFiberHostContext';

import {
  popContextProvider as popLegacyContextProvider,
  popTopLevelContextObject as popTopLevelLegacyContextObject
} from './ReactFiberContext';

import { popProvider } from './ReactFiberNewContext';

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

function throwException() {}
export { unwindInterruptedWork, throwException };
