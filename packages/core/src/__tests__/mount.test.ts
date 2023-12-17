import { View, ViewComponent, mount } from '../core';

describe('mount', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
  });

  it('mount should return ViewComponent when `mount(component)`', () => {
    const result = mount(container, () => () => 'hello');
    expect(result).toBeInstanceOf(ViewComponent);
  });
  it('mount should return View when `mount(component)`', () => {
    const view = new View();
    const result = mount(container, view.anchor);
    expect(result).toBeInstanceOf(View);
    expect(result).toBe(view);
  });
});
