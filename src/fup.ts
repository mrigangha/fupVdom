enum ReconcileCode {
  NONE,
  NEW_TAG,
  NEW_STATE,
  NEW_PROPS,
  MUTATION_CHILDREN,
  UNMOUNT,
  NEW_TEXT,
  MOUNT,
}

export class fupNode {
  constructor(
    public tag: string = "div",
    public props: Record<string, string> = {},
    public children: fupNode[] = [],
    public patchList: ReconcileCode[] = [],
    private states: State<any>[] = [],
  ) {}
  public newChildKeys: number[] = [];
  public el: Node | null = null;
  render(): fupNode[] {
    return [];
  }

  computed() {}
  NewState<T>(value: T): State<T> {
    const state = new State(this, value);
    this.states.push(state);
    return state;
  }
  GetStates(): State<any>[] {
    return this.states;
  }
}

let oldVdom: fupNode | null = null;

export class State<T> {
  constructor(
    private parent: fupNode,
    public value: T,
  ) {}
  setValue(value: T) {
    this.value = value;
    ReCreateNewVdom(currentVDOM);
    fupDiff(oldVDOM, currentVDOM);
    fupReRender(currentVDOM, app, 0);
    oldVDOM = fupSaveSnapshot(currentVDOM);
  }
  getValue(): T {
    return this.value;
  }
}

export class InnerTextNode extends fupNode {
  constructor(public text: string) {
    super("textNode");
    this.text = text;
  }
}

export class ButtonNode extends fupNode {
  public text: InnerTextNode;
  constructor(props: Record<string, string>, text: string) {
    super("button");
    this.props = props;
    this.text = new InnerTextNode(text);
  }
  render(): fupNode[] {
    return [this.text];
  }
}

function ReCreateNewVdom(node: fupNode) {
  node.computed();
  let children: fupNode[] = node.render();
  node.children = children;
  node.children = children;
  for (let i = 0; i < node.children.length; i++) {
    ReCreateNewVdom(node.children[i]);
  }
}

export function fupMountNodeToDom(node: fupNode, container: HTMLElement) {
  currentVDOM = node;
  ReCreateNewVdom(node);
  fupCreateDomTreeFromNode(node);
  container.appendChild(node.el);
  oldVDOM = fupSaveSnapshot(node);
}

let currentVDOM: fupNode | null = null;
let oldVDOM: fupNode | null = null;

export function fupSaveSnapshot(node: fupNode): fupNode {
  if (node.tag === "textNode") {
    let textnode = new InnerTextNode(node.text);
    textnode.el = node.el;
    return textnode;
  }
  let copy_node = new fupNode(node.tag);

  copy_node.el = node.el;
  for (const state of node.GetStates()) {
    copy_node.NewState(state.getValue());
  }
  for (const [key, value] of Object.entries(node.props)) {
    copy_node.props[key] = value;
  }
  for (const child of node.children) {
    copy_node.children.push(fupSaveSnapshot(child));
  }
  return copy_node;
}

function fupCreateDomTreeFromNode(node: fupNode) {
  node.patchList = [];

  if (node instanceof InnerTextNode) {
    const el = document.createTextNode(node.text);
    node.el = el;
    return el;
  }
  const el = document.createElement(node.tag);
  node.el = el;
  for (const [key, value] of Object.entries(node.props)) {
    if (typeof value === "function") {
      const event = key.replace("on", "").toLowerCase(); // "onclick" → "click"
      el.addEventListener(event, value as EventListener);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of node.children) {
    const childEl = fupCreateDomTreeFromNode(child);
    el.appendChild(childEl);
  }
  return el;
}

export function fupDiff(oldNode: fupNode, newNode: fupNode): boolean {
  let isDiff = false;

  newNode.el = oldNode.el;
  if (oldNode.tag !== newNode.tag) {
    newNode.patchList.push(ReconcileCode.NEW_TAG);
    isDiff = true;
  }
  if (oldNode instanceof InnerTextNode && newNode instanceof InnerTextNode) {
    if (oldNode.text != newNode.text) {
      newNode.patchList.push(ReconcileCode.NEW_TEXT);
    }
    return true;
  }
  let isNewProps = false;
  if (Object.keys(newNode.props).length !== Object.keys(oldNode.props).length) {
    for (const [key, value] of Object.entries(oldNode.props)) {
      if (typeof value == "function") {
        if (value !== newNode.props[key] || newNode.props[key] === undefined) {
          const event = key.replace("on", "").toLowerCase();
          oldNode.el?.removeEventListener(
            event,
            oldNode.props[key] as EventListenerOrEventListenerObject,
          );
        }
      }
    }
    isNewProps = true;
    newNode.patchList.push(ReconcileCode.NEW_PROPS);
    isDiff = true;
  } else {
    for (const [key, value] of Object.entries(oldNode.props)) {
      if (newNode.props[key] === undefined || newNode.props[key] !== value) {
        if (typeof value === "function") {
          const event = key.replace("on", "").toLowerCase();
          oldNode.el?.removeEventListener(
            event,
            oldNode.props[key] as EventListenerOrEventListenerObject,
          );
        }
        if (!isNewProps) {
          newNode.patchList.push(ReconcileCode.NEW_PROPS);
          isDiff = true;
          isNewProps = true;
        }
      }
    }
  }

  //Unkeyedn Patch
  if (oldNode instanceof InnerTextNode && newNode instanceof InnerTextNode) {
    if (oldNode.text != newNode.text) {
      newNode.patchList.push(ReconcileCode.NEW_TEXT);
    }
    return true;
  }
  const oldLength = oldNode.children.length;
  const newLength = newNode.children.length;
  const commonLength = Math.min(oldLength, newLength);
  let i;
  let mutation: boolean = false;
  for (i = 0; i < commonLength; i++) {
    let diff = fupDiff(oldNode.children[i], newNode.children[i]);
    mutation = mutation || diff;
    isDiff = isDiff || diff;
  }
  if (mutation) {
    newNode.patchList.push(ReconcileCode.MUTATION_CHILDREN);
  }
  if (oldLength > newLength) {
    for (let i = commonLength; i < oldLength; i++) {
      oldNode.el?.removeChild(oldNode.children[i].el);
    }
  } else if (oldLength < newLength) {
    mutation = true;
    newNode.patchList.push(ReconcileCode.MOUNT);
    for (let i = commonLength; i < newLength; i++) {
      newNode.newChildKeys.push(i);
    }

    // mount new
  }
  isDiff = isDiff || mutation;
  return isDiff;
}

function fupPatchDOM(node: fupNode, container: Node, index: number = 0) {
  for (const patch of node.patchList) {
    if (patch == ReconcileCode.NEW_TAG) {
      let current_elem = node.el;
      container.replaceChild(fupCreateDomTreeFromNode(node), current_elem);
      node.newChildKeys = [];
      node.patchList = [];
      return;
    }
    if (node instanceof InnerTextNode && patch == ReconcileCode.NEW_TEXT) {
      (node.el as Text).textContent = node.text;
    }
    if (patch == ReconcileCode.NEW_PROPS) {
      for (const [key, value] of Object.entries(node.props)) {
        if (typeof value === "function") {
          const event = key.replace("on", "").toLowerCase(); // "onclick" → "click"
          node.el.addEventListener(event, value as EventListener);
        } else {
          node.el.setAttribute(key, value);
        }
      }
    }
    if (patch == ReconcileCode.MUTATION_CHILDREN) {
      for (let i = 0; i < node.children.length; i++) {
        fupPatchDOM(node.children[i], node.el, i);
      }
    }
    if (patch == ReconcileCode.MOUNT) {
      node.newChildKeys.map((x) => {
        node.el?.appendChild(fupCreateDomTreeFromNode(node.children[x]));
      });
      node.newChildKeys = [];
    }
  }
  node.patchList = [];
}

export function patchKeyChildren(
  node: fupNode,
  container: Node,
  index: number,
) {}

export function fupReRender(
  node: fupNode,
  container: Node,
  index: number = -1,
) {
  if (node.patchList) {
    if (container instanceof HTMLElement) {
      fupPatchDOM(node, container, index);
    }
  } else {
    for (let i = 0; i < node.children.length; i++) {
      fupReRender(node.children[i], node.el, i);
    }
  }
}
