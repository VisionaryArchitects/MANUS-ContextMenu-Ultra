# MANUS-ContextMenu-Ultra

> One-click AI text processing via right-click context menu. Built for one-handed, copy-paste-free workflows powered entirely by local Ollama.

---

## What It Does

Select any text on any webpage, right-click, and instantly:

| Action | Result |
|--------|--------|
| **5 Rewrites** | Pick from 5 differently-styled alternatives |
| **Summarize** | 1-2 sentence TL;DR replaces selection inline |
| **Explain Simply** | ELI5 breakdown replaces selection inline |
| **Alternative Ideas** | 5 fresh angles on the topic |
| **Grammar & Polish** | Fixed + improved text replaces selection inline |
| **Format as Bullets** | Converts text to bullet-point outline inline |
| **Copy Full Page** | Entire page text sent to clipboard instantly |
| **Word Count** | Stats toast: words, chars, reading time |

All processing is **100% local** via Ollama at `localhost:11434`. No cloud. No API keys. No data leaving your machine.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+R` | Rewrite (5 alternatives) |
| `Ctrl+Shift+S` | Summarize |
| `Ctrl+Shift+E` | Explain Simply |
| `Ctrl+Shift+G` | Grammar & Polish |

---

## Quick Start

### 1. Start Ollama
```bash
ollama serve
```

### 2. Pull a model
```bash
ollama pull neural-chat
# or: mistral | llama3 | phi3
```

### 3. Load the extension
1. Open Chrome -> `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this repo folder
5. Done!

### 4. Test it
1. Go to any webpage
2. Select some text
3. Right-click -> **MANUS AI Tools** -> **Summarize**
4. Watch the text replace itself in place

---

## File Structure

```
MANUS-ContextMenu-Ultra/
   manifest.json       # MV3 config, permissions, hotkeys
   background.js       # Service worker: context menu + command routing
   llm-processor.js    # LLMProcessor class: all Ollama calls
   content.js          # Inline replacement, variation picker, toast UI
   config.js           # Change model, temperature, timeout here
   .gitignore
   README.md
   icons/              # Add icon-16.png, icon-48.png, icon-128.png
```

---

## Configuration

Edit `config.js` to change the model or tune parameters:

```js
const MANUS_CONFIG = {
  ollama: {
    model:   'neural-chat', // change to: mistral, llama3, phi3...
    timeout: 60000,
  },
  llm: {
    temperature: 0.7,
    maxTokens:   1024,
  },
};
```

---

## Privacy

- No network calls outside `localhost:11434`
- No telemetry, no tracking
- Works fully offline once Ollama is running

---

## Troubleshooting

**No context menu appears** -> Reload extension at `chrome://extensions/`

**Ollama not responding** -> Run `ollama serve` and verify `http://localhost:11434/api/tags` responds

**Slow responses** -> Switch to a smaller model (`phi3`) or reduce `maxTokens` in `config.js`

**Text won't replace inline** -> Some sites block DOM edits. Use **Copy Full Page** + paste manually instead.

---

Built by VisionaryArchitects
