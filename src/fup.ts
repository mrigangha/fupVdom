export class Node {
  constructor(
    public tag: string = "div",
    public props: Record<string, string> = {},
    public children: Node[] = [],
    public isNew: boolean = true,
    private states: State<any>[] = [],
  ) {}
  render() {}
  NewState<T>(value: T): State<T> {
    const state = new State(this, value);
    this.states.push(state);
    return state;
  }
  GetStates(): State<any>[] {
    return this.states;
  }
}

let mLOL = false;

export class State<T> {
  constructor(
    private parent: Node,
    public value: T,
  ) {}
  setValue(value: T) {
    mLOL = true;
    this.value = value;
  }
  getValue(): T {
    return this.value;
  }
}

export class InnerTextNode extends Node {
  constructor(public text: string) {
    super("textNode");
    this.text = text;
  }
}

export function fupMountNodeToDom(node: Node, container: HTMLElement) {
  fupMountNode(node, container);
}

let oldNode: Node | null = null;

export function fupSaveSnapshot(node: Node): Node {
  if (node.tag === "textNode") {
    return new InnerTextNode(node.text);
  }
  let copy_node = new Node(node.tag);
  for (const state of node.GetStates()) {
    copy_node.NewState(state.getValue());
  }
  for (const [key, value] of Object.entries(node.props)) {
    copy_node.props[key] = value;
  }
  for (const child of node.children) {
    copy_node.children.push(fupSaveSnapshot(child));
  }
  oldNode = copy_node;
  return copy_node;
}

function fupMountNode(node: Node, container: HTMLElement) {
  node.isNew = false;
  if (node instanceof InnerTextNode) {
    const el = document.createTextNode(node.text);
    container.appendChild(el);
    return;
  }
  const el = document.createElement(node.tag);
  node.render();
  for (const [key, value] of Object.entries(node.props)) {
    if (typeof value === "function") {
      const event = key.replace("on", "").toLowerCase(); // "onclick" → "click"
      el.addEventListener(event, value as EventListener);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of node.children) {
    fupMountNode(child, el);
  }
  container.appendChild(el);
}

export function fupDiff(oldNode: Node, newNode: Node): boolean {
  let isDiff = false;
  if (oldNode.tag !== newNode.tag) {
    newNode.isNew = true;
    isDiff = true;
  }
  if (oldNode.GetStates().length !== newNode.GetStates().length) {
    newNode.isNew = true;
    isDiff = true;
  }
  for (let i = 0; i < oldNode.GetStates().length; i++) {
    if (
      oldNode.GetStates()[i].getValue() !== newNode.GetStates()[i].getValue()
    ) {
      newNode.isNew = true;
      isDiff = true;
    }
  }
  for (const [key, value] of Object.entries(newNode.props)) {
    if (oldNode.props[key] !== value) {
      newNode.isNew = true;
      isDiff = true;
    }
  }
  if (oldNode.children.length !== newNode.children.length) {
    newNode.isNew = true;
    isDiff = true;
  }
  for (let i = 0; i < oldNode.children.length; i++) {
    isDiff = isDiff || fupDiff(oldNode.children[i], newNode.children[i]);
  }
  return isDiff;
}

export function fupReRender(Node: Node, container: HTMLElement) {}
