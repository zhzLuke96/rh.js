import { rh, buildComponent, mount, View } from '../core';
import { ViewEvent } from '../types';
import { TestUtils } from '../internal/TestUtils';

describe('View', () => {
  beforeEach(() => jest.resetModules());

  it('view events', async () => {
    const container = document.createElement('div');
    const view = new View();

    const evts = [] as string[];
    const evtCall = async (evt: keyof ViewEvent) => {
      await TestUtils.waitForViewEvent(view, evt);
      evts.push(evt);
    };
    const ps = [
      evtCall('init_before'),
      evtCall('init'),
      evtCall('init_after'),
      evtCall('mount_before'),
      evtCall('mounted'),
      evtCall('mount_after'),
      evtCall('unmount_before'),
      evtCall('unmounted'),
      evtCall('unmount_after'),
    ];
    mount(container, view.anchor);
    await TestUtils.nextTimeout();
    view.unmount();
    await Promise.all(ps);
    expect(evts).toEqual([
      'init_before',
      'init',
      'init_after',
      'mount_before',
      'mounted',
      'mount_after',
      'unmount_before',
      'unmounted',
      'unmount_after',
    ]);
  });

  it('view should have the correct diff and patch', async () => {
    const container = document.createElement('div');
    const view = new View();
    view.updateChildren(['hello', ' ', 'world']);
    mount(container, view.anchor);
    await TestUtils.nextTimeout();
    view.updateChildren(['hello', ' ', 'world', ' ', 'foo']);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toEqual('hello world foo');
    view.updateChildren(['hello', ' ', 'world', ' ', 'foo', ' ', 'bar']);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toEqual('hello world foo bar');
    view.updateChildren([]);
    await TestUtils.nextTimeout();
    expect(container.innerHTML).toEqual('');
  });

  it('Text dom needs to be reused when view patching', async () => {
    const container = document.createElement('div');
    const view = new View();
    view.updateChildren(['hello', ' ', 'world']);
    mount(container, view.anchor);
    await TestUtils.nextTimeout();
    const text1 = view.children[0] as Text;
    view.updateChildren(['hello', ' ', 'world', ' ', 'foo']);
    await TestUtils.nextTimeout();
    const text2 = view.children[0] as Text;
    view.updateChildren(['hello', ' ', 'world', ' ', 'foo', ' ', 'bar']);
    await TestUtils.nextTimeout();
    const text3 = view.children[0] as Text;

    expect(text1).toBe(text2);
    expect(text2).toBe(text3);
  });
});
