import { ReactiveEffectRunner } from '@vue/reactivity';
import { hookEffect, source_stack } from '../ComponentSource';
import { rh, rhElem, warpView } from '../rh';

type FragmentChildren = Element | Comment;

const idleRunner = (canRun: () => boolean, runner: () => any) => {
  const innerRunner = () => {
    if (canRun()) {
      runner();
    } else {
      requestIdleCallback(innerRunner);
    }
  };
  innerRunner();
};

/**
 * Fragment Component
 */
export const Fragment = rh.component({
  setup(props, innerRender: () => Array<rhElem>) {
    const ctx = {
      anchor: document.createTextNode(''),
      children: [] as Array<FragmentChildren>,
    };
    let runner: ReactiveEffectRunner;
    const rerender = () => {
      if (runner && !ctx.anchor.parentElement) {
        // when anchor removed, do gc
        runner.effect.stop();
        return;
      }

      // *must be called before all returns, because to register to the effect
      const newChildren = innerRender()
        .map((child) => warpView(child, source_stack.peek()))
        .filter(Boolean);

      const { children: oldChildren, anchor } = ctx;
      const container = anchor.parentElement;
      if (!container) {
        // FIXME 也许可能重复调用
        idleRunner(() => !!anchor.parentElement, rerender);
        return;
      }

      // simple diff based element object
      const length = Math.max(newChildren.length, oldChildren.length);
      for (let idx = 0; idx < length; idx++) {
        const newOne = newChildren[idx];
        const oldOne = oldChildren[idx];

        if (!newOne && oldOne) {
          oldOne.remove();
        } else if (!oldOne && newOne) {
          container.insertBefore(newOne, anchor);
        } else if (oldOne && newOne) {
          if (oldOne === newOne) {
            continue;
          }
          container.replaceChild(newOne, oldOne);
        }
      }
      ctx.children = newChildren as Array<FragmentChildren>;
    };
    runner = hookEffect(rerender);
    return ctx;
  },
  render(ctx) {
    return ctx.anchor;
  },
});
