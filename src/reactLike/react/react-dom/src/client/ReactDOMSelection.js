/* eslint-disable no-unused-expressions */

export function getModernOffsetsFromPoints(
  outerNode,
  anchorNode,
  anchorOffset,
  focusNode,
  focusOffset
) {}

/**
 * 获取焦点在输入框内的位置
 * @param {string} outerNode Element
 */
export function getOffsets(outerNode) {
  const selection = window.getSelection && window.getSelection();

  // 在网页使用者点击一个加载完毕的新打开的页面之前，rangeCount的值是0。
  // 在使用者点击页面之后，rangeCount的值变为1，即使并没有可视的选区(selection)。
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  // 因为在火狐浏览器中档input type = 'number'不能正确的获取位置
  try {
    anchorNode.nodeType;
    focusNode.nodeType;
  } catch (e) {
    return null;
  }
  return getModernOffsetsFromPoints(
    outerNode,
    anchorNode,
    anchorOffset,
    focusNode,
    focusOffset
  );
}
