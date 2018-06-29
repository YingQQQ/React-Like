function canUseDOM() {
  return !!(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.documentElement
  );
}


function canUseWorkers() {
  return typeof Worker !== 'undefined';
}

export default {
  canUseDOM,
  canUseWorkers
};
