/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-mutable-exports */
export let _enabled = false;

export function setEnabled(enabled) {
  _enabled = !!enabled;
}

export function isEnabled() {
  return _enabled;
}
