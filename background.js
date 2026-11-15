chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SHOW_NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: msg.title || 'AuraTab Таймер',
      message: msg.message || 'Время вышло!'
    });
    sendResponse({ ok: true });
    return true;
  }

  const queryYTM = (payload, callback) => {
    chrome.tabs.query({ url: '*://music.youtube.com/*' }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        callback(null, false);
        return;
      }
      const targetTab = tabs[0];
      chrome.tabs.sendMessage(targetTab.id, payload, (res) => {
        if (chrome.runtime.lastError || !res) {
          chrome.scripting.executeScript(
            { target: { tabId: targetTab.id }, files: ['ytm-bridge.js'] },
            () => {
              if (chrome.runtime.lastError) {
                callback(null, false);
                return;
              }
              setTimeout(() => {
                chrome.tabs.sendMessage(targetTab.id, payload, (res2) => {
                  callback(res2 || null, true);
                });
              }, 150);
            }
          );
        } else {
          callback(res, true);
        }
      });
    });
  };

  // Запуск закреплённой фоновой вкладки YTM с восстановлением трека и секунды
  const bootBackgroundYTM = (savedTrack, sendResponse) => {
    let targetUrl = 'https://music.youtube.com';
    const seekSec = savedTrack && savedTrack.currentTime ? Math.floor(savedTrack.currentTime) : 0;

    if (savedTrack && savedTrack.trackUrl && savedTrack.trackUrl.includes('music.youtube.com')) {
      const urlObj = new URL(savedTrack.trackUrl);
      if (seekSec > 0) urlObj.searchParams.set('t', String(seekSec));
      targetUrl = urlObj.toString();
    }

    // Создаём тихую закреплённую вкладку в фоне (active: false), чтобы не перебивать текущую вкладку
    chrome.tabs.create({ url: targetUrl, active: false, pinned: true }, (newTab) => {
      const onTabUpdated = (tabId, changeInfo) => {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onTabUpdated);
          setTimeout(() => {
            chrome.tabs.sendMessage(newTab.id, { type: 'YTM_EXEC', action: 'RESUME_AT', seekTime: seekSec }, (res) => {
              sendResponse({ connected: true, ...(res || savedTrack || {}) });
            });
          }, 1800);
        }
      };
      chrome.tabs.onUpdated.addListener(onTabUpdated);
    });
  };

  if (msg.type === 'YTM_COMMAND') {
    queryYTM({ type: 'YTM_EXEC', action: msg.action }, (res, found) => {
      if (!found) {
        if (msg.action === 'OPEN_OR_TOGGLE' || msg.action === 'BOOT_SAVED') {
          bootBackgroundYTM(msg.savedTrack, sendResponse);
        } else {
          sendResponse({ connected: false });
        }
      } else {
        sendResponse({ connected: true, ...(res || {}) });
      }
    });
    return true;
  }

  if (msg.type === 'YTM_GET_STATUS') {
    queryYTM({ type: 'YTM_POLL' }, (res, found) => {
      if (!found || !res) {
        sendResponse({ connected: false });
      } else {
        sendResponse({ connected: true, ...res });
      }
    });
    return true;
  }
});