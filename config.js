/**
 * MANUS Configuration
 * Edit this file to change the model, Ollama URL, or UI behaviour.
 */

const MANUS_CONFIG = {
  ollama: {
    baseUrl: 'http://localhost:11434/api/generate',
    // Change to any model you have installed: mistral, llama2, llama3, phi3, etc.
    model:   'neural-chat',
    timeout: 60000, // ms - increase if your hardware is slow
  },

  llm: {
    temperature: 0.7,  // 0 = deterministic, 1 = creative
    topP:        0.9,
    maxTokens:   1024, // Reduce for faster responses
  },

  ui: {
    toastDuration: 3000, // ms before success toasts disappear
  },
};

// Recommended models (run: ollama pull <name>)
// neural-chat  - Fast, good quality, recommended default
// mistral      - Fast, creative writing
// llama3       - High quality, slower
// phi3         - Very fast, smaller context
// dolphin-mixtral - Uncensored, creative
