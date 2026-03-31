export class fupNode {
  constructor(
    public tag: string = "div",
    public props: Record<string, string> = {},
    public children: fupNode[] = [],
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
    private parent: fupNode,
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

export class InnerTextNode extends fupNode {
  constructor(public text: string) {
    super("textNode");
    this.text = text;
  }
}

export function fupMountNodeToDom(node: fupNode, container: HTMLElement) {
  container.appendChild(fupCreateDomTreeFromNode(node));
}

let oldNode: fupNode | null = null;

export function fupSaveSnapshot(node: fupNode): fupNode {
  if (node.tag === "textNode") {
    return new InnerTextNode(node.text);
  }
  let copy_node = new fupNode(node.tag);
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

function fupCreateDomTreeFromNode(node: fupNode) {
  node.isNew = false;
  if (node instanceof InnerTextNode) {
    const el = document.createTextNode(node.text);
    return el;
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
    const childEl = fupCreateDomTreeFromNode(child);
    el.appendChild(childEl);
  }
  return el;
}

export function fupDiff(oldNode: fupNode, newNode: fupNode): boolean {
  let isDiff = false;
  if (oldNode.tag !== newNode.tag) {
    newNode.isNew = true;
    isDiff = true;
  }
  if (oldNode.GetStates().length !== newNode.GetStates().length) {
    newNode.isNew = true;
    isDiff = true;
  } else {
    for (let i = 0; i < oldNode.GetStates().length; i++) {
      if (
        oldNode.GetStates()[i].getValue() !== newNode.GetStates()[i].getValue()
      ) {
        newNode.isNew = true;
        isDiff = true;
      }
    }
  }
  if (Object.keys(newNode.props).length !== Object.keys(oldNode.props).length) {
    newNode.isNew = true;
    isDiff = true;
  } else {
    for (const [key, value] of Object.entries(newNode.props)) {
      if (oldNode.props[key] !== value) {
        newNode.isNew = true;
        isDiff = true;
      }
    }
  }

  if (oldNode.children.length !== newNode.children.length) {
    for (let i = 0; i < oldNode.children.length; i++) {
      isDiff = isDiff || fupDiff(oldNode.children[i], newNode.children[i]);
    }
  } else {
    for (let i = 0; i < oldNode.children.length; i++) {
      isDiff = isDiff || fupDiff(oldNode.children[i], newNode.children[i]);
    }
  }
  return isDiff;
}

function fupPatchDOM(Node: fupNode, container: Node, index: number = 0) {
  if (index === -1) {
    (container as HTMLElement).innerHTML = "";
    (container as HTMLElement).appendChild(fupCreateDomTreeFromNode(Node));
    return;
  } else {
    container.replaceChild(
      fupCreateDomTreeFromNode(Node),
      container.childNodes[index],
    );
  }
}

export function fupReRender(
  node: fupNode,
  container: Node,
  index: number = -1,
) {
  if (node.isNew) {
    if (container instanceof HTMLElement) {
      fupPatchDOM(node, container, index);
    }
  } else {
    for (let i = 0; i < node.children.length; i++) {
      fupReRender(node.children[i], container.childNodes[index], i);
    }
  }
}
