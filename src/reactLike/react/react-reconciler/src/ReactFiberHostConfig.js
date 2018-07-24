import * as ReactScheduler from '../../shared/ReactScheduler';
import * as ReactBrowserEventEmitter from '../../react-dom/src/events/ReactBrowserEventEmitter';
import * as ReactInputSelection from '../../react-dom/src/client/ReactInputSelection';
import setTextContent from '../../react-dom/src/client/setTextContent';

let eventsEnabled = null;
let selectionInformation = null;

export const supportsMutation = true;

export const now = ReactScheduler.now;

export const isPrimaryRenderer = false;
export function getPublicInstance(instance) {
  return instance;
}

export function prepareForCommit() {
  eventsEnabled = ReactBrowserEventEmitter.isEnabled();
  selectionInformation = ReactInputSelection.getSelectionInformation();
  ReactBrowserEventEmitter.setEnabled(false);
}

/**
 * 清空文本内容
 * @param {Element}
 */
export function resetTextContent(domElement) {
  setTextContent(domElement, '');
}
