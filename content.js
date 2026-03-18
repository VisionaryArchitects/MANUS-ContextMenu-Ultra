/**
 * MANUS Content Script
 * Inline text processing, replacement, variation picker, and toast UI
 */

console.log('[MANUS] Content script loaded');

const processor = new LLMProcessor();
let isProcessing = false;

// ---- Message listener ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedText') {
    sendResponse({ text: window.getSelection().toString() });
    return false;
  }
  if (message.action === 'processText') {
    handleProcessText(message, sendResponse);
    return true;
  }
});

// ---- Main handler ----
async function handleProcessText(message, sendResponse) {
  const text = message.selectedText || window.getSelection().toString();

  if (!text && message.mode !== 'copyFull') {
    showToast('No text selected', 'error');
    sendResponse({ success: false });
    return;
  }
  if (isProcessing) {
    showToast('Already processing...', 'info');
    sendResponse({ success: false });
    return;
  }

  isProcessing = true;
  showToast('Processing...', 'loading');

  try {
    switch (message.mode) {
      case 'creativeRewrite': {
        const result = await processor.rewriteAlternatives(text);
        if (result.variations?.length) showVariationPicker(result.variations, text);
        break;
      }
      case 'summarize': {
        const r = await processor.summarize(text);
        replaceSelectedText(r);
        showToast('Summarized', 'success');
        break;
      }
      case 'explain': {
        const r = await processor.explainSimply(text);
        replaceSelectedText(r);
        showToast('Explained', 'success');
        break;
      }
      case 'alternatives': {
        const r = await processor.alternatives(text);
        replaceSelectedText(r);
        showToast('Alternatives generated', 'success');
        break;
      }
      case 'grammar': {
        const r = await processor.grammarPolish(text);
        replaceSelectedText(r);
        showToast('Polished', 'success');
        break;
      }
      case 'format': {
        const r = await processor.formatAsBullets(text);
        replaceSelectedText(r);
        showToast('Formatted as bullets', 'success');
        break;
      }
      case 'copyFull': {
        await navigator.clipboard.writeText(document.body.innerText);
        showToast('Full page copied to clipboard', 'success');
        break;
      }
      case 'wordCount': {
        const r = processor.wordCountAndTime(text);
        showToast(r.summary, 'info');
        break;
      }
    }
    sendResponse({ success: true });
  } catch (err) {
    console.error('[MANUS]', err);
    showToast(err.message || 'Error', 'error');
    sendResponse({ success: false, error: err.message });
  } finally {
    isProcessing = false;
  }
}

// ---- Text replacement ----
function replaceSelectedText(newText) {
  const sel = window.getSelection();
  if (!sel.rangeCount) {
    navigator.clipboard.writeText(newText);
    showToast('Copied to clipboard (could not replace inline)', 'info');
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(newText);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

// ---- Variation picker modal ----
function showVariationPicker(variations, originalText) {
  removeEl('manus-overlay');
  removeEl('manus-picker');

  const overlay = el('div', { id: 'manus-overlay' }, `
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,0,.6);z-index:999998;
    backdrop-filter:blur(4px);
  `);

  const modal = el('div', { id: 'manus-picker' }, `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:999999;background:linear-gradient(135deg,#1a1a2e,#16213e);
    border:2px solid #00d4ff;border-radius:12px;padding:24px;
    max-width:680px;width:90%;max-height:80vh;overflow-y:auto;
    box-shadow:0 0 40px rgba(0,212,255,.4);
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;
  `);

  const title = document.createElement('h2');
  title.textContent = 'Choose Your Rewrite';
  title.style.cssText = 'margin:0 0 16px;color:#00d4ff;font-size:1.4rem;';
  modal.appendChild(title);

  variations.forEach((v, i) => {
    const card = el('div', {}, `
      background:#16213e;border:1px solid #2d5a7b;border-radius:8px;
      padding:14px;cursor:pointer;margin-bottom:10px;
      transition:border-color .2s,transform .2s;
    `);
    card.onmouseover = () => { card.style.borderColor='#00d4ff'; card.style.transform='translateX(4px)'; };
    card.onmouseout  = () => { card.style.borderColor='#2d5a7b'; card.style.transform='translateX(0)'; };

    const label = document.createElement('strong');
    label.textContent = `${i+1}. ${v.name}`;
    label.style.cssText = 'color:#00d4ff;display:block;margin-bottom:6px;';

    const purpose = document.createElement('small');
    purpose.textContent = v.purpose || '';
    purpose.style.cssText = 'color:#7dd3fc;font-style:italic;display:block;margin-bottom:6px;';

    const body = document.createElement('p');
    body.textContent = v.text;
    body.style.cssText = 'margin:0;font-size:.95rem;line-height:1.5;color:#e2e8f0;';

    card.append(label, purpose, body);
    card.onclick = () => {
      replaceSelectedText(v.text);
      overlay.remove(); modal.remove();
      showToast(`Replaced with "${v.name}"`, 'success');
    };
    modal.appendChild(card);
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = `
    margin-top:10px;padding:10px 18px;background:#ef4444;
    color:#fff;border:none;border-radius:6px;cursor:pointer;
  `;
  closeBtn.onclick = () => { overlay.remove(); modal.remove(); };
  modal.appendChild(closeBtn);

  overlay.onclick = () => { overlay.remove(); modal.remove(); };
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { overlay.remove(); modal.remove(); document.removeEventListener('keydown', esc); }
  });

  document.body.append(overlay, modal);
}

// ---- Toast system ----
function showToast(msg, type = 'info') {
  injectToastStyles();
  const colors = { success:'#10b981', error:'#ef4444', info:'#3b82f6', loading:'#f59e0b' };
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:999997;
    padding:12px 20px;border-radius:8px;font-size:.95rem;font-weight:500;
    background:${colors[type]||colors.info};color:#fff;
    box-shadow:0 4px 12px rgba(0,0,0,.3);
    animation:manus-in .3s ease-out;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  if (type !== 'loading') {
    setTimeout(() => { t.style.animation='manus-out .3s ease-in forwards'; setTimeout(()=>t.remove(),300); }, 3000);
  }
  return t;
}

function injectToastStyles() {
  if (document.getElementById('manus-styles')) return;
  const s = document.createElement('style');
  s.id = 'manus-styles';
  s.textContent = `
    @keyframes manus-in  { from{transform:translateX(400px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes manus-out { from{transform:translateX(0);opacity:1} to{transform:translateX(400px);opacity:0} }
  `;
  document.head.appendChild(s);
}

// ---- Helpers ----
function el(tag, attrs, cssText) {
  const e = document.createElement(tag);
  Object.assign(e, attrs);
  if (cssText) e.style.cssText = cssText.replace(/\n/g,' ').replace(/\s+/g,' ');
  return e;
}

function removeEl(id) {
  const e = document.getElementById(id);
  if (e) e.remove();
}

console.log('[MANUS] Content script ready');
