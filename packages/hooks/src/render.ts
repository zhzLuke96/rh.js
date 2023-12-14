import { getCurrentView } from "@rhjs/core";
import { ViewComponent } from "@rhjs/core";

export const createRenderTrigger = () => {
  const view = getCurrentView();
  const component = ViewComponent.view2component.get(view);
  if (!component) {
    throw new Error(
      `createRenderTrigger must be called in component setup function.`
    );
  }
  return () => component.update();
};
