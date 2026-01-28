import { createRoot } from "react-dom/client";

import EnhancedNowPlayingButton from "@/components/enhanced-nowplaying-button";

import type { PlasmoCSConfig, PlasmoCSUIJSXContainer, PlasmoCSUIProps, PlasmoRender } from "plasmo";
import type { FC } from "react";

export const config: PlasmoCSConfig = {
  matches: ["https://open.spotify.com/*"],
};

export const getRootContainer = () =>
  new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // PC版: headerタグの一つ目の中に追加
      let rootContainerParent = document.querySelector("header");

      // スマホ版: data-testid="npv-footer"を持つdivの2番目の子要素として追加
      if (!rootContainerParent) {
        const npvFooter = document.querySelector('[data-testid="npv-footer"]');
        if (npvFooter && npvFooter.children.length >= 1) {
          rootContainerParent = npvFooter as HTMLElement;
        }
      }

      if (rootContainerParent) {
        clearInterval(checkInterval);
        const rootContainer = document.createElement("div");

        // スマホ版の場合は2番目の子要素として挿入
        if (rootContainerParent.getAttribute("data-testid") === "npv-footer") {
          const secondChild = rootContainerParent.children[1];
          if (secondChild) {
            rootContainerParent.insertBefore(rootContainer, secondChild);
          } else {
            rootContainerParent.appendChild(rootContainer);
          }
        } else {
          // PC版の場合は末尾に追加
          rootContainerParent.appendChild(rootContainer);
        }

        resolve(rootContainer);
      }
    }, 137);
  });

const PlasmoOverlay: FC<PlasmoCSUIProps> = () => {
  return <EnhancedNowPlayingButton service="spotify" />;
};

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({ createRootContainer }) => {
  if (!createRootContainer) {
    console.error("createRootContainer is undefined.");
    return;
  }
  const rootContainer = await createRootContainer();
  const root = createRoot(rootContainer);
  root.render(<PlasmoOverlay />);
};

export default PlasmoOverlay;
