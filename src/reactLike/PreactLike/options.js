/**
 * Global options
 * @public
 * @typedef Options
 * @property {boolean} [syncComponentUpdates] 如果 ture, 那么`props` 更改会出发组件同步更新, 默认为true
 * @property {(vnode: VNode) => void} [vnode] 处理所有创建的Vnode.
 * @property {(component: Component) => void} [afterMount] 组件加载完成的钩子.
 * @property {(component: Component) => void} [afterUpdate] 组件DOM更新完成的钩子.
 * @property {(component: Component) => void} [beforeUnmount] 组件卸载之前的钩子.
 * @property {(rerender: function) => void} [debounceRendering] 收到组件渲染请求时的钩子, 可以用来取消组件渲染.
 * @property {(event: Event) => Event | void} [event] 事件监听之前调用的钩子. 返回值会替代浏览器原生事件

/** @type {Options}  */
const options = {};

export default options;
