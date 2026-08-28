import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  browser.action.onClicked.addListener(async () => {
    const url = chrome.runtime.getURL('/app.html');
    const existing = await browser.tabs.query({ url });
    if (existing[0]?.id) {
      await browser.tabs.update(existing[0].id, { active: true });
      if (existing[0].windowId) await browser.windows.update(existing[0].windowId, { focused: true });
      return;
    }
    await browser.tabs.create({ url });
  });
});
