import { symbols } from '../constants';
import { useContainerContextProxy } from '../core/context';
import { ReactiveElement } from '../core/ReactiveElement';
import { rh, useElementSource } from '../core/reactiveHydrate';
import { ElementView, FunctionComponentDefine } from '../core/types';

type ScopeProps = {
  tagName?: keyof HTMLElementTagNameMap;
  render: () => ElementView[] | ElementView;
  [k: string]: any;
};

const setupScopeContext = (shadowRoot: ShadowRoot) => {
  const es = useElementSource();
  const context = useContainerContextProxy();

  let supperRoot: any;
  const setRoot = () => {
    supperRoot = context[symbols.STYLESHEET_ROOT];
    context[symbols.STYLESHEET_ROOT] = shadowRoot;
  };
  const resetRoot = () => {
    context[symbols.STYLESHEET_ROOT] = supperRoot;
    supperRoot = undefined;
  };
  es.on('update_before', setRoot);
  es.on('update_after', resetRoot);
  setRoot();
};

export const Scope: FunctionComponentDefine<ScopeProps> = (
  { tagName = 'div', render, ...props },
  state,
  children
) => {
  const shadowHost = rh(tagName, props, ...children);
  const shadowRoot = (<HTMLElement>shadowHost).attachShadow({ mode: 'open' });
  setupScopeContext(shadowRoot);

  return () => {
    let rootChildren = render();
    if (!Array.isArray(rootChildren)) {
      rootChildren = [rootChildren];
    }
    rootChildren
      .map((child) => ReactiveElement.warp(child))
      .filter(Boolean)
      .forEach((child) => shadowRoot.appendChild(child!));
    return shadowHost;
  };
};
