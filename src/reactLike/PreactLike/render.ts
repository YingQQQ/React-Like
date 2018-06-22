interface vnode {
  nodeName: string;
  attributes: {
    [propName: string]: any;
  };
  children: Array<any>;
}

export default function render(
  vnode: vnode | string | Function,
  container?: HTMLElement | null | undefined
): HTMLElement | Text | null {
  let n: any;
  if (typeof vnode === 'string') {
    return document.createTextNode(vnode);
  }
  if (typeof vnode === 'object') {
    n = document.createElement(vnode.nodeName);
    const attributes: Array<any> = Object.keys(vnode.attributes || {});
    if (attributes.length) {
      attributes.forEach(
        (k: string): void => n.setAttribute(k, vnode.attributes[k])
      );
    }
    (vnode.children || []).forEach((c: string) =>
      n.appendChild(render(c, null))
    );

    if (container) {
      container.appendChild(n);
    } else {
      document.body.appendChild(n);
    }
  }
  return n;
}

interface virtualDOM {
  nodeName: string | Function;
  attributes: {
    [propName: string]: any;
  };
  children: Array<any>;
}

type ReactElement = virtualDOM;
type DOMContainer = Element | Document;

export function renderDOM(element: ReactElement, container: DOMContainer, callback?: Function) {

}
