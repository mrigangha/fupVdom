# A Virtual Dom Implementation
This is a virtual dom learning experience for me by recreating it in vannila JS or maybe TS.

## Features Implemented till now..
1. VDOM Tree
2. Reconcilation of DOM (Till april 4th only UnKeyed is Implemented).
3. States and Updates


## Demo
Below is a demo program it is just a toy nd learning.

```js
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
    let test = () => {
      this.count.setValue(this.count.getValue() + 1);
    };
    let test2 = () => {
      this.count.setValue(this.count.getValue() - 1);
    };
    let test3 = () => {
      console.log("Updated");
      this.count.setValue(this.count.getValue() - 1);
    };
    if (this.count.getValue() >= 10) {
      return [
        new ButtonNode({ onclick: test2 }, this.count.getValue().toString()),
        new InnerTextNode(this.count.getValue().toString()),
        new ButtonNode({ onclick: test }, this.count.getValue().toString()),
        new InnerTextNode(this.count.getValue().toString()),
        new InnerTextNode(this.count.getValue().toString()),
      ];
    } else {
      return [
        new ButtonNode({ onclick: test3 }, this.count.getValue().toString()),
        new InnerTextNode(this.count.getValue().toString()),
        new ButtonNode({ onclick: test }, this.count.getValue().toString()),
      ];
    }
  }
}

let vdom = new CustomNode();

fupMountNodeToDom(vdom, app);
