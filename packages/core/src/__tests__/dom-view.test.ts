import { DomView } from '../core';
import { TestUtils } from '../internal/TestUtils';

describe('DomView', () => {
  let container: HTMLDivElement;
  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
  });

  it('when mount DomView after, it should update children and props', async () => {
    const view = new DomView('div', { id: 'test' }, ['hello']);
    view.mount(container);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('<div id="test">hello</div>');
  });
  it('when update DomView after, it should update children and props', async () => {
    const view = new DomView('div', { id: 'test' }, ['hello']);
    view.mount(container);
    await TestUtils.nextTimeout();
    view.domProps = { id: 'test2' };
    view.domChildren = ['world'];
    view.updateDom();
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('<div id="test2">world</div>');
  });
  it('when DomView removed, it should just remove self and keep children', async () => {
    const view = new DomView('div', { id: 'test' }, ['hello']);
    view.mount(container);
    await TestUtils.nextTimeout();
    view.remove();
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('');
    expect(view.children.length).toEqual(1);
    expect(view.elem.innerHTML).toBe('hello');
  });
});
