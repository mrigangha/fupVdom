import {
  InnerTextNode,
  fupNode,
  fupMountNodeToDom,
  State,
  ButtonNode,
} from "./fup.ts";

let app: HTMLElement = document.getElementById("app")!;

class CustomNode extends fupNode {
  constructor() {
    super("div", {}, []);
    this.count = this.NewState<number>(10);
  }
  count: State<number>;
  render() {
    this.key = 0;
    let test = () => {
      this.count.setValue(this.count.getValue() + 1);
    };
    let test2 = () => {
      this.count.setValue(this.count.getValue() - 1);
    };
    let test3 = () => {
      this.count.setValue(this.count.getValue() - 1);
    };
    if (this.count.getValue() >= 10) {
      return [
        new ButtonNode({ onclick: test2 }, this.count.getValue().toString(), 0),
        new InnerTextNode(this.count.getValue().toString(), 1),
        new ButtonNode({ onclick: test }, this.count.getValue().toString(), 2),
        new InnerTextNode(this.count.getValue().toString(), 3),
        new InnerTextNode(this.count.getValue().toString(), 5),
      ];
    } else {
      return [
        new InnerTextNode(this.count.getValue().toString(), 1),
        new InnerTextNode(this.count.getValue().toString(), 8),
        new ButtonNode({ onclick: test3 }, this.count.getValue().toString(), 9),
        new ButtonNode({ onclick: test }, this.count.getValue().toString(), 2),
      ];
    }
  }
}

let vdom = new CustomNode();

fupMountNodeToDom(vdom, app);
