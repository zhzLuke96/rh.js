import { globalIdleScheduler } from './IdleScheduler';

// Reduce DOMRemoved event firing
export const cheapRemoveElem = (elem?: Node) => {
  if (!elem) {
    return;
  }
  const run = (parentNode: Node) => {
    let old_hidden: boolean | undefined = undefined;
    if (elem instanceof HTMLElement) {
      old_hidden = elem.hidden ?? false;
      // hidden element to trigger rendering synchronously
      elem.hidden = true;
    }
    globalIdleScheduler.runTask(() => {
      parentNode.contains(elem) && parentNode.removeChild(elem);
      if (elem instanceof HTMLElement && old_hidden !== undefined) {
        // rollback hidden value to prevent
        elem.hidden = old_hidden;
      }
    });
  };
  const parentNode = elem.parentNode;
  if (parentNode && document.contains(parentNode)) {
    run(parentNode);
  } else if (parentNode && elem.getRootNode() !== elem) {
    // in shadow
    run(parentNode);
  }
};
