import { rh } from "@rhjs/core";

const ns = <TagNameMap>(namespaceURI: string = "") => {
  const cache = new Map<string, (...args: any[]) => Node>();
  return new Proxy(
    {},
    {
      get: (_, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(tag, (props?: any, ...children: any[]) => {
            if (
              props instanceof Node ||
              props instanceof String ||
              Array.isArray(props) ||
              typeof props !== "object"
            ) {
              children.unshift(props);
              props = {};
            }
            return rh(
              namespaceURI
                ? document.createElementNS(namespaceURI, tag)
                : document.createElement(tag),
              props,
              ...children
            );
          });
        }
        return cache.get(tag)!;
      },
      has: () => true,
    }
  ) as {
    // TODO props type auto completion
    [K in keyof TagNameMap]: (props?: any, ...children: any[]) => TagNameMap[K];
  };
};

const html = ns<HTMLElementTagNameMap>();
const svg = ns<SVGElementTagNameMap>("http://www.w3.org/2000/svg");
const math = ns<HTMLElementTagNameMap>("http://www.w3.org/1998/Math/MathML");

export const tags = {
  html,
  svg,
  math,
  ns,
};
