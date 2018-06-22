import { hasOwnProperty } from './util/index';

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};

interface Attributes {
  key?: string | number | any;
  ref?: string | number | any;
}

interface Component<P = {}, S = {}> {
  componentWillMount?(): void;
  componentDidMount?(): void;
  componentWillUnmount?(): void;
  getChildContext?(): object;
  componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
  shouldComponentUpdate?(
    nextProps: Readonly<P>,
    nextState: Readonly<S>,
    nextContext: any
  ): boolean;
  componentWillUpdate?(
    nextProps: Readonly<P>,
    nextState: Readonly<S>,
    nextContext: any
  ): void;
  componentDidUpdate?(
    previousProps: Readonly<P>,
    previousState: Readonly<S>,
    previousContext: any
  ): void;
}
type Ref<T> = (instance: T) => void;
type RenderableProps<P, RefType = any> = Readonly<
  P & Attributes & { children?: ComponentChildren; ref?: Ref<RefType> }
>;

interface FunctionalComponent<P = {}> {
  (props: RenderableProps<P>, context?: any): VNode<any> | null;
  displayName?: string;
  defaultProps?: Partial<P>;
}

type Key = string | number;
type ComponentFactory<P> = ComponentConstructor<P> | FunctionalComponent<P>;

interface VNode<P = any> {
  nodeName: ComponentFactory<P> | string;
  attributes: P;
  children: Array<VNode<any> | string>;
  key?: Key | null;
}

interface ComponentConstructor<P = {}, S = {}> {
  new (props: P, context?: any): Component<P, S>;
  displayName?: string;
  defaultProps?: Partial<P>;
}
type ComponentChild = VNode<any> | string | number | null;
type ComponentChildren =
  | ComponentChild[]
  | ComponentChild
  | object
  | string
  | number
  | null;

type nodeName = string | ComponentConstructor | null;

function hasVaildRef(config: Attributes) {
  return config.ref !== undefined;
}
function hasVaildKey(config: Attributes) {
  return config.key !== undefined;
}

export default function createElement(
  type: nodeName,
  config: Attributes,
  ...children: ComponentChildren[]
) {
  const childrenLen = children.length;
  let props: object = {};
  let tag = 5;
  let key = null;
  let ref = null;

  if (type) {
    tag = 1;
  }

  if (config != null) {
    if (hasVaildRef(config)) {
      ref = config.ref;
    }
    if (hasVaildKey(config)) {
      key = config.key;
    }
  }

  props = propsFactory(type, config || {}, props, children, childrenLen);
}

function propsFactory(
  type: nodeName,
  config: attributes,
  props: attributes,
  children: any[],
  childrenLen: number | undefined
) {
  let defaultProps;

  const attributes: any[] = Object.keys(config);

  attributes.forEach((attr: string) => {
    if (
      hasOwnProperty.call(attributes, attr) &&
      hasOwnProperty.call(RESERVED_PROPS, attr)
    ) {
      props[attr] = config[attr];
    }
  });

  if (type && typeof type === 'function' && type.defaultProps) {
  }

  return {};
}
