import { rh, mount, ViewComponent, Component } from '../core';

export const test_utils = {
  ComponentElement: Text,
  justMount: (node: Node) => {
    const container = document.createElement('div');
    mount(container, node);
    return container;
  },
  mountComponent: (component: Component, props: any = {}) => {
    const container = document.createElement('div');
    const instance = mount(container, component, props);
    return {
      container,
      instance,
    };
  },
  nextTimeout: () => new Promise((resolve) => setTimeout(resolve, 0)),
} as const;
