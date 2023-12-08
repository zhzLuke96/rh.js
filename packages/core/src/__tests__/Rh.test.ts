import { rh, ViewComponent } from '../core';
import { test_utils } from '../internal/test_utils';

describe('rh', () => {
  beforeEach(async () => {
    // jest.resetModules();
  });

  it('should be able return dom', async () => {
    const view = rh('div', null, 'hello');
    expect(view).toBeInstanceOf(Element);

    test_utils.justMount(view);
    await test_utils.nextTimeout();
    expect((view as Element).outerHTML).toBe('<div>hello</div>');
  });

  it('should be able return dom with props', async () => {
    const view = rh('div', { id: 'hello' }, 'hello');
    expect(view).toBeInstanceOf(Element);

    test_utils.justMount(view);
    await test_utils.nextTimeout();
    expect((view as Element).outerHTML).toBe('<div id="hello">hello</div>');
  });

  it('should be able return dom with children', async () => {
    const view = rh('div', null, rh('span', null, 'hello'));
    expect(view).toBeInstanceOf(Element);

    test_utils.justMount(view);
    await test_utils.nextTimeout();
    expect((view as Element).outerHTML).toBe('<div><span>hello</span></div>');
  });

  it('should be able return dom with children array', async () => {
    const view = rh('div', null, [
      rh('span', null, 'hello'),
      rh('span', null, 'world'),
    ]);
    expect(view).toBeInstanceOf(Element);

    test_utils.justMount(view);
    await test_utils.nextTimeout();
    expect((view as Element).outerHTML).toBe(
      '<div><span>hello</span><span>world</span></div>'
    );
  });

  it('should be able return dom with children array and null', async () => {
    const view = rh('div', null, [
      rh('span', null, 'hello'),
      null,
      rh('span', null, 'world'),
    ]);
    expect(view).toBeInstanceOf(Element);

    test_utils.justMount(view);
    await test_utils.nextTimeout();
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
    const { container, instance } = test_utils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await test_utils.nextTimeout();
    expect(container.innerHTML).toBe('<div>hello</div>');
  });

  it('should be able return dom with props', async () => {
    const Hello = (props: { id: string }) => () =>
      rh('div', { id: props.id }, 'hello');
    const { container, instance } = test_utils.mountComponent(Hello, {
      id: 'hello',
    });
    expect(instance).toBeInstanceOf(ViewComponent);
    await test_utils.nextTimeout();
    expect(container.innerHTML).toBe('<div id="hello">hello</div>');
  });

  it('should be able return dom with children', async () => {
    const Hello = () => () => rh('div', null, rh('span', null, 'hello'));
    const { container, instance } = test_utils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await test_utils.nextTimeout();
    expect(container.innerHTML).toBe('<div><span>hello</span></div>');
  });

  it('should be able return dom with children array', async () => {
    const Hello = () => () =>
      rh('div', null, [rh('span', null, 'hello'), rh('span', null, 'world')]);
    const { container, instance } = test_utils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await test_utils.nextTimeout();
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
    const { container, instance } = test_utils.mountComponent(Hello);
    expect(instance).toBeInstanceOf(ViewComponent);
    await test_utils.nextTimeout();
    expect(container.innerHTML).toBe(
      '<div><span>hello</span><span>world</span></div>'
    );
  });
});
