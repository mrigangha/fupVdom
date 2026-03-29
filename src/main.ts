import {
  InnerTextNode,
  Node,
  fupMountNodeToDom,
  fupSaveSnapshot,
  State,
  fupDiff,
  fupReRender,
} from "./fup";

let app: HTMLElement = document.getElementById("app")!;

class CustomNode extends Node {
  constructor() {
    super("h1", {}, [new InnerTextNode("Hello, World!")]);
  }
}

class ButtonNode extends Node {
  private count: State<number>;
  constructor() {
    super("button");
    let test = () => {
      this.count.setValue(this.count.getValue() + 1);
      console.log(this.count);
      fupDiff(oldVdom, vdom);
      reRender(vdom);
      oldVdom = fupSaveSnapshot(vdom);
    };
    this.count = this.NewState<number>(0);
    this.props = { onclick: test };
  }
  render() {
    this.children = [new InnerTextNode(this.count.getValue().toString())];
  }
}

let vdom = new ButtonNode();
let oldVdom = fupSaveSnapshot(vdom);
fupMountNodeToDom(vdom, app);
console.log(vdom.isNew);

function reRender(node: Node) {
  if (node.isNew) {
    app.innerHTML = "";
    fupMountNodeToDom(node, app);
  }
}
