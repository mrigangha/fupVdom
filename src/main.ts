import {
  InnerTextNode,
  fupNode,
  fupMountNodeToDom,
  fupSaveSnapshot,
  State,
  fupDiff,
  fupReRender,
} from "./fup.ts";

let app: HTMLElement = document.getElementById("app")!;

class CustomNode extends fupNode {
  constructor() {
    super("div", {}, []);
  }
  render() {
    this.children = [new InnerTextNode("Hello World"), new ButtonNode()];
  }
}

class ButtonNode extends fupNode {
  private count: State<number>;
  constructor() {
    super("button");
    let test = () => {
      this.count.setValue(this.count.getValue() + 1);
      let diff = fupDiff(oldVdom, vdom);
      fupReRender(vdom, app, 0);
      oldVdom = fupSaveSnapshot(vdom);
    };
    this.count = this.NewState<number>(0);
    this.props = { onclick: test };
  }
  render() {
    this.children = [new InnerTextNode(this.count.getValue().toString())];
  }
}

let vdom = new CustomNode();

fupMountNodeToDom(vdom, app);
let oldVdom = fupSaveSnapshot(vdom);
