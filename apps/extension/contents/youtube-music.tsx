import { createRoot } from "react-dom/client";

import EnhancedNowPlayingButton from "@/components/enhanced-nowplaying-button";

import type { PlasmoCSConfig, PlasmoCSUIJSXContainer, PlasmoCSUIProps, PlasmoRender } from "plasmo";
import type { FC } from "react";

export const config: PlasmoCSConfig = {
  matches: ["https://music.youtube.com/*"],
};

export const getRootContainer = () =>
  new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const rootContainerParent = document.querySelector("#sections");
      if (rootContainerParent) {
        clearInterval(checkInterval);
        const rootContainer = document.createElement("div");
        rootContainerParent.appendChild(rootContainer);
        resolve(rootContainer);
      }
    }, 137);
  });

const PlasmoOverlay: FC<PlasmoCSUIProps> = () => {
  return <EnhancedNowPlayingButton />;
};

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({ createRootContainer }) => {
  if (!createRootContainer) {
    return;
  }
  const rootContainer = await createRootContainer();
  const root = createRoot(rootContainer);
  root.render(<PlasmoOverlay />);
};

export default PlasmoOverlay;
