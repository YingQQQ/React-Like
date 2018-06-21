/* eslint-disable  no-plusplus */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-underscore-dangle */
/* eslint-disable  no-use-before-define */
/* eslint-disable  import/no-mutable-exports */
/* eslint-disable  no-nested-ternary */
import { ATTR_KEY } from '../constants';
import { removeNode, isNamedNode, isSameNodeType } from '../dom/index';
import { unmountComponent, buildComponentFromVNode } from './component';
import options from '../options';
import { createNode, setAccessor } from '../dom/index';

/**
 * 组件队列,已经被挂载的组件或者等待被挂载的组件
 */
export const mounts = [];

/**
 * 用来记录当前渲染的层数(递归的深度)，其实在代码中并没有在进入每层递归的时候都增加并且退出递归的时候减小。
 */
export let diffLevel = 0;
/**
 * 全局变量,用于判断是不是在SVG的容器内
 */
let isSvgMode = false;
/**
 * 全局变量,用于判断是否含有属性props的缓存
 */

let hydrating = false;

/**
 * 就是将队列mounts中取出组件实例，然后如果存在生命周期函数componentDidMount，则对应执行
 * 上面有两处调用函数flushMounts，一个是在renderComponent内部，一个是在diff函数。
 * 那么在什么情况下触发上下两段代码呢？
 * 首先componentRoot表示的是当前diff是不是以组件中渲染内容的形式调用
 * (比如组件中render函数返回HTML类型的VNode)，
 * 那么preact.render函数调用时肯定componentRoot是false，
 * diffLevel表示渲染的层次，diffLevel回减到0说明已经要结束diff的调用，
 * 所以在使用preact.render渲染的最后肯定会使用上面的代码去调用函数flushMounts。
 * 但是如果其中某个已经渲染的组件通过setState或者forceUpdate的方式导致了重新渲染
 * 并且致使子组件创建了新的实例(比如前后两次返回了不同的组件类型)
 * 这时，就会采用第一种方式在调用flushMounts函数
 */
export function flushMounts() {
  let c = mounts.pop();
  while (c) {
    if (options.afterMount) {
      options.afterMount(c);
    }
    if (c.componentDidMount) {
      c.componentDidMount();
    }
    c = mounts.pop();
  }
}

/**
 * 回收/卸载所有的子元素
 * 我们在这里使用了.lastChild而不是使用.firstChild，是因为访问节点的代价更低。
 */
export function removeChildren(node) {
  node = node.lastChild;
  while (node) {
    const next = node.previousSibling;
    recollectNodeTree(node, true);
    node = next;
  }
}

/**
 * 递归地回收(或者卸载)节点及其后代节点
 * @param node
 * @param unmountOnly 如果为`true`,仅仅触发卸载的生命周期，跳过删除
 */
export function recollectNodeTree(node, unmountOnly) {
  const component = node._component;
  if (component) {
    // 如果该节点属于某个组件，卸载该组件(最终在这里递归)
    // 主要包括组件的回收和相依卸载生命周期的调用
    unmountComponent(component);
  } else {
    // 如果节点含有ref函数，则执行ref函数，参数为null(这里是React的规范，用于取消设置引用)
    // 确实在React如果设置了ref的话，在卸载的时候，也会被回调，得到的参数是null
    if (node[ATTR_KEY] != null && node[ATTR_KEY].ref) {
      node[ATTR_KEY].ref(null);
    }
    if (unmountOnly === false || node[ATTR_KEY] == null) {
      // 要做的无非是从父节点将该子节点删除
      removeNode(node);
    }
    // 递归卸载组件
    removeChildren(node);
  }
}

/**
 * Apply child and attribute changes between a VNode and a DOM Node to the DOM.
 * @param {import('../dom').PreactElement} dom Element whose children should be compared & mutated
 * @param {Array<import('../vnode').VNode>} vchildren Array of VNodes to compare to `dom.childNodes`
 * @param {object} context Implicitly descendant context object (from most
 *  recent `getChildContext()`)
 * @param {boolean} mountAll Whether or not to immediately mount all components
 * @param {boolean} isHydrating if `true`, consumes externally created elements
 *  similar to hydration
 */
function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
  const originalChildren = dom.childNodes;
  const children = [];
  const keyed = [];
  const len = originalChildren.length;
  const vlen = vchildren ? vchildren.length : 0;
  let keyedLen = 0;
  let min = 0;
  let childrenLen = 0;
  let j;
  let c;
  let f;
  let child;

  // len是父级dom的子元素个数，首先对所有的子元素进行遍历，
  // 如果该元素是由Preact所渲染(也就是有props的缓存)
  // 并且含有key值(不考虑组件的情况下，我们暂时只看该元素props中是否有key值)，
  // 这样我们其实就将子元素划分为两类，一类是带有key值的子元素，一类是没有key的子元素。
  if (len !== 0) {
    for (let i = 0; i < len; i++) {
      const original = originalChildren[i];
      const props = original[ATTR_KEY];
      const key =
        vlen && props
          ? original._component
            ? original._component.__key
            : props.key
          : null;
      if (key !== null) {
        keyedLen++;
        keyed[key] = original;
      } else if (
        props ||
        (original.splitText !== undefined
          ? isHydrating
            ? original.nodeValue.trim()
            : true
          : isHydrating)
      ) {
        children[childrenLen++] = original;
      }
    }
  }

  if (vlen !== 0) {
    for (let i = 0; i < vlen; i++) {
      const vchild = vchildren[i];
      // 尝试通过键值匹配去寻找节点
      const key = child.key;
      child = null;
      // 首先判断该子元素是否含有属性key,如果含有则在keyed中查找对应keyed的dom元素，
      // 并在keyed将该元素删除。否则在children查找是否含有和该元素相同类型的节点(利用函数isSameNodeType),
      // 如果查找到相同类型的节点，则在children中删除并根据对应的情况(即查到的元素在children查找范围的首尾)缩小排查范围。
      // 然后递归执行函数idiff，如果之前child没有查找到的话，会在idiff中创建对应类型的节点。
      // 然后根据之前的所分析的，idiff会返回新的dom节点
      if (key != null && keyedLen && keyed[key] !== undefined) {
        child = keyed[key];
        keyed[key] = undefined;
        keyedLen--;
        // 尝试从现有的孩子节点中找出类型相同的节点
      } else if (min < childrenLen) {
        for (j = min; j < childrenLen; j++) {
          c = childrenLen[j];
          if (
            childrenLen[j] !== undefined &&
            isSameNodeType(c, vchild, isHydrating)
          ) {
            child = c;
            children[j] = undefined;
            if (j === childrenLen - 1) {
              childrenLen--;
            }
            if (j === min) {
              min++;
            }
            break;
          }
        }
      }
      // 变形匹配/寻找到/创建的DOM子元素来匹配vchild(深度匹配)
      child = idiff(child, vchild, context, mountAll);

      f = originalChildren[i];
      // 如果idiff返回dom不为空并且该dom与原始dom中对应位置的dom不相同时，
      // 将其添加到父节点。如果不存在对应位置的真实节点，则直接添加到父节点。
      // 如果child已经添加到对应位置的真实dom后，则直接将其移除当前位置的真实dom，
      // 否则都将其添加到对应位置之前。
      if (child && child !== dom && child !== f) {
        if (f == null) {
          dom.appendChild(child);
        } else if (child === f.nextSibling) {
          removeNode(f);
        } else {
          dom.insertBefore(child, f);
        }
      }
    }
  }
  if (keyedLen) {
    Object.keys(keyed).forEach((i) => {
      if (keyed[i] !== undefined) {
        recollectNodeTree(keyed[i], false);
      }
    });
  }

  while (min <= childrenLen) {
    child = childrenLen[childrenLen--];
    if (child !== undefined) {
      recollectNodeTree(child, false);
    }
  }
}

function diffAttributes(dom, attrs, old) {
  // 通过将其设置为undefined，移除不在vnode中的属性
  Object.keys(old).forEach((name) => {
    if (!(attrs && attrs[name] != null) && old[name] != null) {
      setAccessor(dom, name, old[name], (old[name] = undefined), isSvgMode);
    }
  });
  Object.keys(attrs).forEach((name) => {
    if (
      name !== 'children' &&
      name !== 'innerHTML' &&
      (!(name in old) ||
        attrs[name] !==
          (name !== 'value' || name !== 'checked' ? dom[name] : old[name]))
    ) {
      setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
    }
  });
}

/**
 * 内部接口 `diff()`, 允许绕过 diffLevel / mount 刷新.
 * @param {import('../dom').PreactElement} dom 插入`vnode`的DOM元素
 * @param {import('../vnode').VNode} vnode A VNode 虚拟DOM树
 * @param {object} context 当前的contex
 * @param {boolean} mountAll 是否立即挂载当前组件
 * @param {boolean} [componentRoot] ?
 * @private
 */
function idiff(dom, vnode, context, mountAll, componentRoot) {
  let out;
  const prevSvgMode = isSvgMode;
  // 空的node 渲染空的文本节点
  if (vnode == null || typeof vnode === 'boolean') {
    vnode = '';
  }
  // String & Number 类型的节点 创建/更新 文本节点
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    // 更新已经存在的文本节点
    // 如果节点值是文本类型，其父节点又是文本类型的节点，则直接更新
    if (
      dom &&
      dom.parentNode &&
      dom.splitText !== undefined &&
      (!dom._component || componentRoot) &&
      dom.nodeValue !== vnode
    ) {
      dom.nodeValue = vnode;
    } else {
      // 如果不是文本节点则直接替换掉原来的元素
      // 1. 创建一个新的文本节点
      out = document.createTextNode(vnode);
      if (dom) {
        // 2.1 如果dom存在父元素,则用新的文本替换掉原来的内容
        if (dom.parentNode) {
          dom.parentNode.replaceChild(out, dom);
        }
        // 递归卸载组件
        recollectNodeTree(dom, true);
      }
    }
    // 标记是Preact创建的元素
    out[ATTR_KEY] = true;

    return out;
  }
  // 如果是VNode代表的是一个嵌套组件，使用组件的diff
  let vnodeName = vnode.nodeName;
  if (typeof vnodeName === 'function') {
    return buildComponentFromVNode(dom, vnode, context, mountAll);
  }

  // 沿着树向下时记录记录存在的SVG命名空间

  isSvgMode =
    vnodeName === 'svg'
      ? true
      : vnodeName === 'foreignObject'
        ? false
        : isSvgMode;
  vnodeName = String(vnodeName);
  // 如果之前的dom为空(说明之前没有渲染)或者dom的名称与vnode.nodename不一致时，说明我们要创建新的元素.
  // 如果节点是由Preact创建的(即由函数createNode创建的)，
  // 其中dom节点中含有属性normalizedNodeName(node.normalizedNodeName = nodeName),
  // 则使用normalizedNodeName去判断节点类型是否相等，否则直接采用dom节点中的nodeName属性去判断。
  if (!dom || !isNamedNode(dom, vnodeName)) {
    out = createNode(vnodeName, isSvgMode);
    // 如果之前的dom节点中存在子元素，则将其全部移入新创建的元素中。
    if (dom) {
      // 移动dom中的子元素到out中
      while (dom.firstChild) {
        out.appendChild(dom.firstChild);
      }
      // 如果之前的元素已经属于某一个DOM节点，则将其替换
      if (dom.parentNode) {
        dom.parentNode.replaceChild(out, dom);
      }
      // 回收之前的dom元素(跳过非元素类型)
      recollectNodeTree(dom, true);
    }
  }
  // 到此为止渲染的当前虚拟dom的过程已经结束，接下来就是处理子元素的过程。

  // 如果out是新创建的元素或者该元素不是由Preact创建的(即不存在属性__preactattr_)，
  // 我们会初始化out中的__preactattr_属性中并将out元素(刚创建的dom元素)
  // 中属性attributes缓存在out元素的ATTR_KEY(__preactattr_)属性上。

  const fc = out.firstChild;
  const vchildren = vnode.children;
  let props = out[ATTR_KEY];

  if (props == null) {
    props = {};
    out[ATTR_KEY] = null;
    const a = out.attributes;
    for (let i = a.length; i--;) {
      props[a[i].name] = a[i].value;
    }
  }
  // 优化: 对于元素只包含一个单一文本节点的优化路径
  // 进入单个节点的判断条件也是比较明确的，唯一需要注意的一点是,必须满足hydrating不为true，
  // 因为我们知道当hydrating为true是说明当前的节点并不是由Preact渲染的，
  // 因此不能进行直接的优化，需要由下一层递归中创建新的文本元素
  if (
    !hydrating &&
    vchildren &&
    vchildren.length === 1 &&
    typeof vchildren[0] === 'string' &&
    vchildren[0].splitText &&
    fc.nextSibling == null &&
    fc.nodeValue !== vchildren[0]
  ) {
    fc.nodeValue = vchildren[0];
  } else if ((vchildren && vchildren.length) || fc != null) {
    // 否则，如果有存在的子节点或者新的孩子节点，执行diff
    innerDiffNode(
      out,
      vchildren,
      context,
      mountAll,
      hydrating || props.dangerouslySetInnerHTML != null
    );
  }
  // 某个节点的属性发生改变，比如name由1变成了2，那么out属性中的缓存(__preactattr_)也需要得到更新，
  // 则需要调用 diffAttributes, 将props和atrributes从VNode中应用到DOM元素
  diffAttributes(out, vnode.attributes, props);

  // 恢复到之前的isSvg模式
  isSvgMode = prevSvgMode;

  return out;
}
/**
 *
 * @param {*} dom 需要合并比较的真实dom
 * @param {*} vnode 第一就是null或者是例子中的contaienr(就是render函数对应的第三个参数)，第二种就是vnode的对应的未更新的真实dom
 * @param {boolean} context
 * @param {*} mountAll
 * @param {dom} parent 就是要将虚拟dom挂载的父节点
 * @param {*} componentRoot
 */
export default function diff(
  dom,
  vnode,
  context,
  mountAll,
  parent,
  componentRoot
) {
  if (!diffLevel) {
    diffLevel++;
    isSvgMode = parent != null && parent.ownerSVGElement !== undefined;
    // hydrating 指示的是被diff的现存元素是否含有属性props的缓存
    // 属性props的缓存被存在dom节点的__preactattr_属性中
    // 只有当前的dom节点并不是由Preact所创建并渲染的才会使得hydrating为true。
    hydrating = dom != null && !(ATTR_KEY in dom);
  }
  const ret = idiff(dom, vnode, context, mountAll, componentRoot);

  if (parent && ret.parentNode !== parent) {
    parent.appendChild(ret);
  }
  if (!--diffLevel) {
    hydrating = false;
    if (!componentRoot) {
      flushMounts();
    }
  }
  return ret;
}
