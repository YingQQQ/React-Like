/**
 * 根据元素名称创建一个DOM元素
 * @param {string} nodeName DOM名称
 * @param {boolean} [isSvg=false] 如果true,则创建一个SVG元素
 *  命名空间.
 * @returns {PreactElement} The created DOM node
 */
export function createNode(nodeName, isSvg) {
  const node = isSvg
    ? document.createElementNS('http://www.w3.org/2000/svg', nodeName)
    : document.createElement(nodeName);
  node.normalizedNodeName = nodeName;
  return node;
}

/**
 * 删除子节点
 * @param {dom} node
 */
export function removeNode(node) {
  const parentNode = node.parent;
  if (parentNode) {
    parentNode.removeChild(node);
  }
}
