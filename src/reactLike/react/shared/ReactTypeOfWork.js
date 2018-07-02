// 虚拟DOM树的主干,可以被嵌套
export const ClassComponent = 2;
export const HostRoot = 3;
export const HostPortal = 4; // 子虚拟树,能被随时插入到渲染中
export const HostComponent = 5;
export const ContextProvider = 13;
