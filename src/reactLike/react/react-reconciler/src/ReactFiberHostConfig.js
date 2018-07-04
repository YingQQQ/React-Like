import * as ReactScheduler from '../../shared/ReactScheduler';
import * as ReactBrowserEventEmitter from '../../react-dom/src/events/ReactBrowserEventEmitter';

let eventsEnabled = null;
let selectionInformation = null;

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

