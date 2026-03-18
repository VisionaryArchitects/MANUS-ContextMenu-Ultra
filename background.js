/**
 * MANUS Context Menu Ultra - Background Service Worker
 * Manages context menu creation and keyboard command routing
 */

console.log('[MANUS] Background service worker initialized');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[MANUS] Extension installed/updated:', details.reason);
  initializeContextMenus();
});

function initializeContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'manus-parent',
      title: '✨ MANUS AI Tools',
      contexts: ['selection'],
    });

    const actions = [
      { id: 'rewrite-alternatives', title: '5️⃣  Rewrite (5 Alternatives)' },
      { id: 'summarize',            title: '📝 Summarize (TL;DR)' },
      { id: 'explain',              title: '🧠 Explain Simply' },
      { id: 'alternatives',         title: '💡 Alternative Ideas' },
      { id: 'grammar',              title: '🎯 Grammar & Polish' },
      { id: 'format',               title: '📊 Format as Bullets' },
      { id: 'sep1',                 type: 'separator' },
      { id: 'copy-context',         title: '🔗 Copy Full Page to Clipboard' },
      { id: 'word-count',           title: '⏱️  Word Count & Reading Time' },
    ];

    actions.forEach((action) => {
      if (action.type === 'separator') {
        chrome.contextMenus.create({ id: action.id, parentId: 'manus-parent', type: 'separator' });
      } else {
        chrome.contextMenus.create({
          id: action.id,
          parentId: 'manus-parent',
          title: action.title,
          contexts: ['selection'],
        });
      }
    });

    console.log('[MANUS] Context menus initialized');
  });
}

const MENU_MODE_MAP = {
  'rewrite-alternatives': 'creativeRewrite',
  'summarize':            'summarize',
  'explain':              'explain',
  'alternatives':         'alternatives',
  'grammar':              'grammar',
  'format':               'format',
  'copy-context':         'copyFull',
  'word-count':           'wordCount',
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const mode = MENU_MODE_MAP[info.menuItemId];
  if (!mode) return;
  chrome.tabs.sendMessage(tab.id, {
    action: 'processText',
    mode,
    selectedText: info.selectionText,
  });
});

const COMMAND_MODE_MAP = {
  'quick-rewrite':   'creativeRewrite',
  'quick-summarize': 'summarize',
  'quick-explain':   'explain',
  'quick-grammar':   'grammar',
};

chrome.commands.onCommand.addListener((command) => {
  const mode = COMMAND_MODE_MAP[command];
  if (!mode) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
      if (!response || !response.text) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-128.png',
          title: 'MANUS - No text selected',
          message: 'Select text first, then use the hotkey.',
        });
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'processText',
        mode,
        selectedText: response.text,
      });
    });
  });
});
