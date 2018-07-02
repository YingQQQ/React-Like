import * as ReactScheduler from '../../shared/ReactScheduler';

export function getPublicInstance(instance) {
  return instance;
}

export const now = ReactScheduler.now;

export const isPrimaryRenderer = false;
