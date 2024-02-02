import { Component, DomView, View, ViewComponent, compile } from "@rhjs/core";
type RhTreeNode =
  | {
      name: keyof HTMLElementTagNameMap | Component;
      props: Record<string, any>;
      children: (RhTreeNode | string)[];
    }
  | {
      name: "#text";
      content: string;
      _wild?: boolean;
      _node?: Node;
    };

export const tree = (el: Node): RhTreeNode => {
  if (el instanceof Text) {
    const view = View.anchor2view.get(el);
    if (!view) {
      return {
        name: "#text",
        content: el.textContent || "",
      };
    }
    const component = ViewComponent.view2component.get(view);
    if (component) {
      return {
        name: component._component_type,
        props: component.props,
        children: component.view.children.map(tree),
      };
    }
    return {
      name: "#text",
      content: "",
      // _wild: true,
      // _node: el,
    };
  }
  if (el instanceof HTMLElement) {
    const view = View.anchor2view.get(el);
    const component = view && ViewComponent.view2component.get(view);
    if (!view || !component) {
      return {
        name: el.tagName.toLowerCase() as any,
        props: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {} as Record<string, any>),
        children: component?.view.children.map(tree) || [],
      };
    }
    return {
      name: component._component_type,
      props: component.props,
      children: component.children.map((child) =>
        child instanceof Node ? tree(child) : child
      ),
    };
  }
  return {
    name: "#text",
    content: "",
    _wild: true,
    _node: el,
  };
};
export const hydrate = (node: RhTreeNode): DomView => {
  if (node.name === "#text") {
    throw new Error("Cannot hydrate text node");
  }
  // TODO
  // const hydrateChildren = (node: RhTreeNode) =>
  //   node.name === "#text"
  //     ? document.createTextNode(node.content)
  //     : hydrate(node);
  // const { name, props, children } = node;
  // const $dom = document.createElement(name as any);
  // const domView = new DomView($dom, props, children.map(hydrateChildren));
  // return domView;
  throw new Error("TODO");
};
