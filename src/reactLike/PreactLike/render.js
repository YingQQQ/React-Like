import diff from './vdom/diff';

/**
 * 将一个Preact组件渲染到 containerNode 这个DOM节点上。 返回一个对渲染的DOM节点的引用
 * @param {import('./vnode').VNode} vnode A (JSX) 组件
 * @param {import('./dom').PreactElement} parent 父元素
 * @param {import('./dom').PreactElement} [merge] 如果提供了可选的DOM节点参数 merge 并且是 PreactElement
 * 的子节点，Preact将使用它的diffing算法来更新或者替换该元素节点。否则，Preact将把渲染的元素添加到 PreactElement 上
 *
 * @public
 *
 * @example
 * //下面这些例子展示了如何在具有以下HTML标记的页面中执行render()
 *
 * <div id="container">
 *  <h1>My App</h1>
 * </div>
 *
 * @example
 * const container = document.getElementById('container')
 * render(MyComponent, container);
 * 将 MyComponent 添加到 container 中
 * <div id="container">
 *  <h1>My App</h1>
 *  <MyComponent />
 * </div>
 *
 * @example
 *
 * const merge = container.querySelector('h1');
 * render(MyComponent, container, merge);
 * 对比 MyComponent 和 <h1>My App</h1> 的不同
 * <div id="container">
 *  <MyComponent />
 * </div>
 * // babel转义
 * render(
 *  {
 *   nodeName: ƒ App(argument),
 *   children: [
 *       {
 *           nodeName: ƒ Child(argument),
 *           children: ["Hello World!"],
 *           attributes: undefined,
 *           key: undefined
 *       }
 *   ],
 *   attributes: undefined,
 *   key: undefined
 *  }
 *  container,
 *  merger
 * )
 */
export default function render(vnode, parent, merge) {
  return diff(merge, vnode, {}, false, parent, false);
}
