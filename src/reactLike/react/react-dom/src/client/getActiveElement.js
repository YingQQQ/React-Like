/**
 * activeElement 属性返回文档中当前获得焦点的元素。
 * @param {string}  doc NodeElement 
 */
export default function getActiveElement(
  doc = typeof document !== 'undefined' ? document : undefined
) {
  if (typeof doc === 'undefined') {
    return null;
  }
  try {
    return doc.activeElement || doc.body;
  } catch (e) {
    return doc.body;
  }
}
