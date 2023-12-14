import { component, DomView, rh, compile, ViewComponent } from '../core';
import { TestUtils } from '../internal/TestUtils';

describe('rh', () => {
  beforeEach(async () => {
    // jest.resetModules();
  });

  it('1. dom view should be mount', async () => {
    const view = compile('div', null, 'hello');
    const node = view.elem;
    expect(node).toBeInstanceOf(Element);

    const waitInit = TestUtils.waitForViewEvent(view, 'init_after');

    TestUtils.justMount(view);
    if (!(view instanceof DomView)) {
      throw new Error('view is not DomView');
    }
    await waitInit;
    await TestUtils.nextTimeout();
    expect(view.status).toBe('mounted');
    expect(view.domChildren.length).toBe(1);
    expect(view.children.length).toBe(1);
    expect((node as Element).outerHTML).toBe('<div>hello</div>');
  });

  it('2. should be able return dom with props', async () => {
    const view = rh('div', { id: 'hello' }, 'hello');
    expect(view).toBeInstanceOf(Element);

    TestUtils.justMount(view);
    await TestUtils.nextTimeout();
    expect((view as Element).outerHTML).toBe('<div id="hello">hello</div>');
  });

  it('3. should be able return dom with children', async () => {
    const view = rh('div', null, rh('span', null, 'hello'));
    expect(view).toBeInstanceOf(Element);

    TestUtils.justMount(view);
    await TestUtils.nextTimeout();
    expect((view as Element).outerHTML).toBe('<div><span>hello</span></div>');
  });

  it('4. should be able return dom with children array', async () => {
    const view = rh('div', null, [
      rh('span', null, 'hello'),
      rh('span', null, 'world'),
    ]);
    expect(view).toBeInstanceOf(Element);

    TestUtils.justMount(view);
    await TestUtils.nextTimeout();
    expect((view as Element).outerHTML).toBe(
      '<div><span>hello</span><span>world</span></div>'
    );
  });

  it('5. should be able return dom with children array and null', async () => {
    const view = rh('div', null, [
      rh('span', null, 'hello'),
      null,
      rh('span', null, 'world'),
    ]);
    expect(view).toBeInstanceOf(Element);

    TestUtils.justMount(view);
    await TestUtils.nextTimeout();
    expect((view as Element).outerHTML).toBe(
      '<div><span>hello</span><span>world</span></div>'
    );
  });
});

describe('rh with function component', () => {
  beforeEach(async () => {
    // jest.resetModules();
  });

  it('should be able return dom', async () => {
    const Hello = () => () => rh('div', null, 'hello');
    const { container, instance } = TestUtils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('<div>hello</div>');
  });

  it('should be able return dom with props', async () => {
    const Hello = (props: { id: string }) => () =>
      rh('div', { id: props.id }, 'hello');
    const { container, instance } = TestUtils.mountComponent(Hello, {
      id: 'hello',
    });
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('<div id="hello">hello</div>');
  });

  it('should be able return dom with children', async () => {
    const Hello = () => () => rh('div', null, rh('span', null, 'hello'));
    const { container, instance } = TestUtils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('<div><span>hello</span></div>');
  });

  it('should be able return dom with children array', async () => {
    const Hello = () => () =>
      rh('div', null, [rh('span', null, 'hello'), rh('span', null, 'world')]);
    const { container, instance } = TestUtils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe(
      '<div><span>hello</span><span>world</span></div>'
    );
  });

  it('should be able return dom with children array and null', async () => {
    const Hello = () => () =>
      rh('div', null, [
        rh('span', null, 'hello'),
        null,
        rh('span', null, 'world'),
      ]);
    const { container, instance } = TestUtils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe(
      '<div><span>hello</span><span>world</span></div>'
    );
  });
});

describe('rh with setup component', () => {
  beforeEach(async () => {
    // jest.resetModules();
  });

  it('should be able return dom', async () => {
    const Hello = component({
      setup(props: {}, children) {
        return {};
      },
      render(props, state, children) {
        return rh('div', null, 'hello');
      },
    });
    const { container, instance } = TestUtils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('<div>hello</div>');
  });

  it('111 should be able return dom with props', async () => {
    const Hello = component({
      setup(props: { id: string }, children) {
        return {};
      },
      render(props, state, children) {
        return rh('div', { id: props.id }, 'hello');
      },
    });
    const { container, instance } = TestUtils.mountComponent(Hello, {
      id: 'hello',
    });
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('<div id="hello">hello</div>');
  });

  it('should be able return dom with children', async () => {
    const Hello = component({
      setup(props: {}, children) {
        return {};
      },
      render(props, state, children) {
        return rh('div', null, rh('span', null, 'hello'));
      },
    });
    const { container, instance } = TestUtils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe('<div><span>hello</span></div>');
  });

  it('should be able return dom with children array', async () => {
    const Hello = component({
      setup(props: {}, children) {
        return {};
      },
      render(props, state, children) {
        return rh('div', null, [
          rh('span', null, 'hello'),
          rh('span', null, 'world'),
        ]);
      },
    });
    const { container, instance } = TestUtils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe(
      '<div><span>hello</span><span>world</span></div>'
    );
  });

  it('should be able return dom with children array and null', async () => {
    const Hello = component({
      setup(props: {}, children) {
        return {};
      },
      render(props, state, children) {
        return rh('div', null, [
          rh('span', null, 'hello'),
          null,
          rh('span', null, 'world'),
        ]);
      },
    });
    const { container, instance } = TestUtils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toBe(
      '<div><span>hello</span><span>world</span></div>'
    );
  });
});
