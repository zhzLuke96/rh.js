import { Component, InlineRenderResult, rh } from "@rhjs/core";
import { Fragment, Scope } from "@rhjs/builtin";
import { HTMLTemplateToken, tokenizeHTMLTemplate } from "./tokenize";

type HTMLTemplateNode = {
  tag: any;
  attributes: any;
  children: (HTMLTemplateNode | string)[];
};

function throwTokenError(token: HTMLTemplateToken, should: string): never {
  const { value, type, index } = token;
  const position =
    index.value !== undefined
      ? `values:${index.value}`
      : `strings:${index.strings}:${index.string}`;
  throw new Error(
    `Expected token '${value}', at position [${position}]
    should match [${should}] but got [${value}]`
  );
}

function htmlRoot(strings: TemplateStringsArray, ...values: any[]) {
  const root = {
    tag: "ROOT",
    attributes: {},
    children: [],
  } as HTMLTemplateNode;
  const stack = [root];
  const current = () => stack[stack.length - 1];

  const tokens = tokenizeHTMLTemplate(strings, ...values);

  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx];
    const node = current();
    const { type, value } = token;
    switch (type) {
      case "tag": {
        const child = {
          tag: value,
          attributes: {},
          children: [],
        };
        node.children.push(child);
        stack.push(child);
        break;
      }
      case "value": {
        const keyNode = tokens[idx - 2];
        node.attributes[keyNode.value] = value;
        break;
      }
      case "text": {
        node.children.push(value);
        break;
      }
      case "tag_end": {
        const popNode = stack.pop();
        if (
          token.value &&
          token.value !== "/" &&
          popNode?.tag !== token.value
        ) {
          throwTokenError(token, popNode?.tag);
        }
        break;
      }
      default:
        break;
    }
  }

  return root;
}

const validTagNameRegex = /^[a-z][a-z0-9\-_]*$/;
const createHTMLTagger =
  (rootComponent: Component) =>
  (strings: TemplateStringsArray, ...values: any[]) => {
    const root = htmlRoot(strings, ...values);
    const walk = (
      node:
        | HTMLTemplateNode
        | Node
        | string
        | number
        | boolean
        | null
        | void
        | undefined,
      is_svg_dom = false
    ): InlineRenderResult => {
      if (node === undefined || node === null) {
        return null;
      }
      if (node instanceof Node) {
        return node;
      }
      if (typeof node !== "object") {
        return node;
      }
      if (typeof node.tag === "string") {
        if (!validTagNameRegex.test(node.tag)) {
          const string =
            (<any>node).tpl_index && strings[(<any>node).tpl_index];
          throw new Error(
            `Unexpected tag ${node.tag} at ${
              string ? `\`${string}\`}` : "[UNKNOWN]"
            }`
          );
        }
      }
      const self_is_svg_dom = typeof node === "object" && node.tag === "svg";
      const next_is_svg_dom = self_is_svg_dom || is_svg_dom;
      const tag = next_is_svg_dom
        ? document.createElementNS("http://www.w3.org/2000/svg", node.tag)
        : node.tag;
      return rh(
        tag,
        node.attributes,
        node.children.map((node) => walk(node, next_is_svg_dom))
      );
    };
    root.tag = rootComponent;
    return walk(root);
  };

const fragmentHTML = createHTMLTagger(Fragment);
const scopeHTML = createHTMLTagger(Scope);

export const html = fragmentHTML as typeof fragmentHTML & {
  scoped: typeof scopeHTML;
};
html.scoped = scopeHTML;
