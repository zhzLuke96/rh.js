/**
 * catch global error
 */
export const onRhError = (callback: (errLike: any) => any) => {
  const globalParent = document.body.parentElement || document.body;
  globalParent.addEventListener('rh-err', (ev) => {
    if ('detail' in ev) {
      callback(ev['detail']);
    }
  });
};
