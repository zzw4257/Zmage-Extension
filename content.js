(() => {
  function gatherMediaElements() {
    const items = [];
    const seen = new Set();

    const addItem = (item) => {
      if (!item || !item.src) return;
      if (seen.has(item.src)) return;
      seen.add(item.src);
      items.push(item);
    };

    document.querySelectorAll('img').forEach((img) => {
      const src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-original');
      if (!src) return;
      addItem({
        type: 'image',
        src,
        alt: img.alt || img.getAttribute('aria-label') || '',
        title: img.title || ''
      });
    });

    document.querySelectorAll('video').forEach((video) => {
      let src = video.currentSrc || video.src;
      if (!src) {
        const source = video.querySelector('source[src]');
        if (source) {
          src = source.src;
        }
      }
      if (!src) return;
      addItem({
        type: 'video',
        src,
        alt: video.getAttribute('aria-label') || '',
        title: video.title || video.getAttribute('name') || ''
      });
    });

    return items;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'scan-page-resources') {
      try {
        const resources = gatherMediaElements();
        sendResponse({ resources });
      } catch (error) {
        sendResponse({ error: error.message || String(error) });
      }
      return true;
    }
    return undefined;
  });
})();
