// 就是应用层面的React组件。ClassComponent是一个继承自React.Component的类的实例。
export const ClassComponent = 2;
// ReactDOM.render()时的根节点
export const HostRoot = 3;
export const HostPortal = 4; // 子虚拟树,能被随时插入到渲染中
// React中最常见的抽象节点，是ClassComponent的组成部分。具体的实现取决于React运行的平台。在浏览器环境下就代表DOM节点，
// 可以理解为所谓的虚拟DOM节点。HostComponent中的Host就代码这种组件的具体操作逻辑是由Host环境注入的。
export const HostComponent = 5;
export const ContextProvider = 13;
