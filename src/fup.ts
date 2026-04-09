enum ReconcileCode {
  NONE,
  NEW_TAG,
  NEW_STATE,
  NEW_PROPS,
  MUTATION_CHILDREN,
  NEW_TEXT,
  MOUNT,
}

export class fupNode {
  constructor(
    public tag: string = "div",
    public props: Record<string, any> = {},
    public children: fupNode[] = [],
    public patchList: ReconcileCode[] = [],
    private states: State<any>[] = [],
  ) {}
  public newChildKeys: fupNode[][] = [];
  public el: Node | null = null;
  public key: number | null = null;
  public childKeyMap: Record<number, number> = {};
  public reloacte_index: number | null = null;

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
  constructor(
    public text: string,
    key_: number | null = null,
  ) {
    super("textNode");
    this.text = text;
    this.key = key_;
  }
}

export class ButtonNode extends fupNode {
  public text: InnerTextNode;
  constructor(
    props: Record<string, string>,
    text: string,
    key_: number | null = null,
  ) {
    super("button");
    this.props = props;
    this.key = key_;
    this.text = new InnerTextNode(text);
  }
  render(): fupNode[] {
    return [this.text];
  }
}

function ReCreateNewVdom(node: fupNode) {
  node.computed();
  node.children = node.render();
  for (const child of node.children) {
    ReCreateNewVdom(child);
  }
}

export function fupMountNodeToDom(node: fupNode, container: HTMLElement) {
  currentVDOM = node;
  ReCreateNewVdom(node);
  for (let i = 0; i < node.children.length; i++) {
    if (node.children[i].key) {
      node.childKeyMap[node.children[i].key] = i;
    }
  }
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
    if (node.key !== null) {
      textnode.key = node.key;
    }
    return textnode;
  }
  let copy_node = new fupNode(node.tag);
  if (node.key !== null) {
    copy_node.key = node.key;
  }
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

  let mutation: boolean = false;
  //Unkeyedn Patch
  if (newNode.key == null) {
    const oldLength = oldNode.children.length;
    const newLength = newNode.children.length;
    const commonLength = Math.min(oldLength, newLength);
    let i;

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
      if (!mutation) {
        newNode.patchList.push(ReconcileCode.MUTATION_CHILDREN);
      }
      for (let i = commonLength; i < newLength; i++) {
        newNode.children[i]?.patchList.push(ReconcileCode.MOUNT);
        newNode.newChildKeys.push(newNode.children[i]);
      }

      // mount new
    }
  } else {
    newNode.patchList.push(ReconcileCode.MUTATION_CHILDREN);
    const newKeyMap = new Map<number, { index: number; node: fupNode }>();
    const unUsedNode: fupNode[] = [];
    for (let i = 0; i < newNode.children.length; i++) {
      const k = newNode.children[i].key;
      if (k != null) newKeyMap.set(k, { index: i, node: newNode.children[i] });
    }

    const oldKeyMap = new Map<number, { index: number; node: fupNode }>();
    let domArray: Node[] = [];
    for (let i = 0; i < oldNode.children.length; i++) {
      const k = oldNode.children[i].key;
      if (k == null || !newKeyMap.has(k)) {
        unUsedNode.push(oldNode.children[i]);
      }
      if (k != null) oldKeyMap.set(k, { index: i, node: oldNode.children[i] });
      domArray.push(oldNode.children[i].el!);
    }

    let c: number = 0;
    for (let i = 0; i < newNode.children.length; i++) {
      const k = newNode.children[i].key;
      if (k != null && oldKeyMap.has(k)) {
        const oldIndex = oldKeyMap.get(k)!.index;
        fupDiff(oldKeyMap.get(k)!.node, newNode.children[i]);
      } else {
        if (unUsedNode.length != 0 && c < unUsedNode.length) {
          fupDiff(unUsedNode[c], newNode.children[i]);
          c += 1;
        } else {
          newNode.children[i]?.patchList.push(ReconcileCode.MOUNT);
          newNode.newChildKeys.push(newNode.children[i]);
        }
      }
    }
    if (unUsedNode.length > c) {
      for (let i = c; i < unUsedNode.length; i++) {
        oldNode.el?.removeChild(unUsedNode[i].el!);
      }
    }
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
      for (let i = 0; i < node.children.length; i++) {
        const anchor = node.el.childNodes[i] ?? null;
        if (node.children[i].el !== anchor) {
          node.el.insertBefore(node.children[i].el!, anchor);
        }
      }
      // Mount new nodes
      node.newChildKeys.forEach((x) => fupPatchDOM(x, node.el, -1));
      node.newChildKeys = [];
    }
    if (patch == ReconcileCode.MOUNT) {
      container.appendChild(fupCreateDomTreeFromNode(node));
    }
  }
  node.patchList = [];
}

export function fupReRender(
  node: fupNode,
  container: Node,
  index: number = -1,
) {
  if (node.patchList.length > 0) {
    if (container instanceof HTMLElement) {
      fupPatchDOM(node, container, index);
    }
  }
  for (let i = 0; i < node.children.length; i++) {
    fupReRender(node.children[i], node.el, i);
  }
}
