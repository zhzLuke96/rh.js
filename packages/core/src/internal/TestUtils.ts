import { rh, mount, ViewComponent, View, DomView } from '../core';
import { Component } from '../types';
import { ViewEvent } from '../types';

export const TestUtils = {
  ComponentElement: Text,
  justMount: (node: Node | View | DomView | ViewComponent) => {
    const container = document.createElement('div');
    if (node instanceof View) {
      node.mount(container);
      return node;
    }
    if (node instanceof ViewComponent) {
      node.view.mount(container);
      return node.view;
    }
    return mount(container, node);
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
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  waitForViewEvent: (view: View, eventName: keyof ViewEvent) => {
    return new Promise<Parameters<ViewEvent[keyof ViewEvent]>>((resolve) => {
      view.events.once(eventName, (...args) => {
        resolve(args);
      });
    });
  },
} as const;
