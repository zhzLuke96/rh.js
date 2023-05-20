// Reduce DOMRemoved event firing
export const cheapRemoveElem = (elem?: Node) => {
  const parentNode = elem?.parentNode;
  if (parentNode && document.contains(parentNode)) {
    parentNode.removeChild(elem);
  } else if (parentNode && elem.getRootNode() !== elem) {
    // in shadow
    parentNode.removeChild(elem);
  }
};
