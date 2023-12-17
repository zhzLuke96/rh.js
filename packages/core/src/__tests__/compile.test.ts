import { DomView, View, ViewComponent, compile } from '../core';

describe('compile', () => {
  beforeEach(() => jest.resetModules());

  it('compile should return DomView when type is string', () => {
    const compiled = compile('div');
    expect(compiled).toBeInstanceOf(DomView);
  });
  it('compile should return View when type is view.anchor', () => {
    const view = new View();
    const compiled = compile(view.anchor);
    expect(compiled).toBeInstanceOf(View);
    expect(compiled).toBe(view);
  });
  it('compile should return ViewComponent when type is function', () => {
    const compiled = compile(() => () => 'hello');
    expect(compiled).toBeInstanceOf(ViewComponent);
  });
  it('compile should return ViewComponent when type is SetupComponent', () => {
    const compiled = compile({
      setup() {
        return {};
      },
      render() {
        return 'hello';
      },
    });
    expect(compiled).toBeInstanceOf(ViewComponent);
  });

  it('compile should keep props when args.props is undefined', () => {
    const compiled1 = compile('div', { id: 'test' });
    const compiled2 = compile(compiled1.elem) as DomView;
    expect(compiled2.domProps).toEqual({ id: 'test' });
  });
  it('compile should keep props when args.props is defined', () => {
    const compiled1 = compile('div', { id: 'test' });
    const compiled2 = compile(compiled1.elem, { id: 'test2' }) as DomView;
    expect(compiled2.domProps).toEqual({ id: 'test2' });
  });

  it('compile should keep children when args.children is undefined', () => {
    const compiled1 = compile('div', { id: 'test' }, 'hello');
    const compiled2 = compile(compiled1.elem) as DomView;
    expect(compiled2.domChildren).toEqual(['hello']);
  });
  it('compile should keep children when args.children is defined', () => {
    const compiled1 = compile('div', { id: 'test' }, 'hello');
    const compiled2 = compile(
      compiled1.elem,
      { id: 'test' },
      'world'
    ) as DomView;
    expect(compiled2.domChildren).toEqual(['world']);
  });
});
