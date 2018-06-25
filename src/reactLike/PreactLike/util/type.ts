export interface Attributes<P = any> {
  key?: string | number | any;
  ref?: string | number | any;
  [propName: string]: P;
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

interface FunctionalComponent<P = {}> {
  (props: RenderableProps<P>, context?: any): VNode<any> | null;
  displayName?: string;
  defaultProps?: Partial<P>;
}

export interface VNode<P = any> {
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
export type ComponentChild = VNode<any> | string | number | null;
export type ComponentChildren =
  | ComponentChild[]
  | ComponentChild
  | object
  | string
  | number
  | null;
type Ref<T> = (instance: T) => void;
export type nodeName = string | ComponentConstructor | null;
type RenderableProps<P, RefType = any> = Readonly<
  P & Attributes & { children?: ComponentChildren; ref?: Ref<RefType> }
>;
export type Key = string | number;
type ComponentFactory<P> = ComponentConstructor<P> | FunctionalComponent<P>;
