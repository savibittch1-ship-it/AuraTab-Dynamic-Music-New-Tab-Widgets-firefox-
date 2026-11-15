if (!window.__auratabYtmInjected) {
  window.__auratabYtmInjected = true;

  function getTrackState() {
    const ms = navigator.mediaSession && navigator.mediaSession.metadata;
    const titleEl = document.querySelector('ytmusic-player-bar .title');
    const artistEl = document.querySelector('ytmusic-player-bar .byline');
    const coverEl = document.querySelector('ytmusic-player-bar img.image');
    const videoEl = document.querySelector('video');
    const linkEl = document.querySelector('ytmusic-player-bar a.ytp-title-link, ytmusic-player-bar .title-group a');

    const title = (ms && ms.title) || (titleEl ? titleEl.textContent.trim() : '');
    const artist = (ms && ms.artist) || (artistEl ? artistEl.textContent.trim() : '');

    let cover = '';
    if (ms && ms.artwork && ms.artwork.length > 0) {
      cover = ms.artwork[ms.artwork.length - 1].src;
    } else if (coverEl && coverEl.src && !coverEl.src.startsWith('data:')) {
      cover = coverEl.src.replace(/w\d+-h\d+/, 'w544-h544');
    }

    const isPlaying = videoEl ? !videoEl.paused : false;
    const currentTime = videoEl ? Math.floor(videoEl.currentTime) : 0;
    const duration = videoEl && videoEl.duration ? videoEl.duration : 0;

    // Получаем прямую ссылку на текущий трек для точного восстановления
    let trackUrl = window.location.href;
    if (linkEl && linkEl.href && linkEl.href.includes('watch?v=')) {
      trackUrl = linkEl.href;
    }

    return {
      title: title || '',
      artist: artist || '',
      cover,
      trackUrl,
      currentTime,
      isPlaying,
      progress: duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
    };
  }

  function executePlayerAction(action, seekTime) {
    const playBtn = document.querySelector('#play-pause-button');
    const nextBtn = document.querySelector('.next-button');
    const prevBtn = document.querySelector('.previous-button');
    const videoEl = document.querySelector('video');

    if (action === 'RESUME_AT' && typeof seekTime === 'number') {
      if (videoEl) {
        if (seekTime > 0 && Math.abs(videoEl.currentTime - seekTime) > 3) {
          videoEl.currentTime = seekTime;
        }
        if (videoEl.paused) {
          videoEl.play().catch(() => {
            if (playBtn) playBtn.click();
          });
        }
      } else if (playBtn) {
        playBtn.click();
      }
      return;
    }

    if (action === 'TOGGLE' || action === 'OPEN_OR_TOGGLE') {
      if (playBtn) playBtn.click();
      else if (videoEl) videoEl.paused ? videoEl.play() : videoEl.pause();
    } else if (action === 'NEXT') {
      if (nextBtn) nextBtn.click();
    } else if (action === 'PREV') {
      if (prevBtn) prevBtn.click();
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'YTM_POLL') {
      sendResponse(getTrackState());
    } else if (msg.type === 'YTM_EXEC') {
      executePlayerAction(msg.action, msg.seekTime);
      setTimeout(() => sendResponse(getTrackState()), 160);
      return true;
    }
  });
}