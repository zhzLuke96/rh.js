import { symbols } from "./constants";
import { useContextProxy } from "@rhjs/core";
import { FC, InlineRender, rh, useCurrentView, View } from "@rhjs/core";

type ScopeProps = {
  tagName?: keyof HTMLElementTagNameMap;
  slotRender?: InlineRender;
  [k: string]: any;
};

const setupScopeContext = (shadowRoot: ShadowRoot) => {
  const view = View.topView();
  const context = useContextProxy();

  let supperRoot: any;
  const setRoot = () => {
    supperRoot = context[symbols.STYLESHEET_ROOT];
    context[symbols.STYLESHEET_ROOT] = shadowRoot;
  };
  const resetRoot = () => {
    context[symbols.STYLESHEET_ROOT] = supperRoot;
    supperRoot = undefined;
  };
  view.events.on("update_before", setRoot);
  view.events.on("update_after", resetRoot);
  setRoot();
};

export const Scope: FC<ScopeProps> = (
  { tagName = "div", slotRender, ...props },
  state,
  children
) => {
  const shadowHost = rh(tagName, props, slotRender);
  const shadowRoot = (<HTMLElement>shadowHost).attachShadow({ mode: "open" });
  setupScopeContext(shadowRoot);

  const scopeView = useCurrentView();
  rh(shadowRoot, {}, children);
  const view = View.dom2view.get(shadowRoot);
  if (view) {
    shadowRoot.appendChild(view.anchor);
    view.parentView = scopeView;
    view.initialize();
  }
  return () => shadowHost;
};

export const getRootNode = (): DocumentOrShadowRoot & Node => {
  const context = useContextProxy();
  return context[symbols.STYLESHEET_ROOT] || document;
};
