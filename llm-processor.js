/**
 * MANUS LLM Processor
 * Handles all local LLM calls to Ollama at localhost:11434
 * Loaded as a content script before content.js
 */

class LLMProcessor {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434/api/generate';
    this.model   = config.model   || 'neural-chat';
    this.timeout = config.timeout || 60000;
  }

  async generateText(prompt, options = {}) {
    const body = {
      model:       this.model,
      prompt,
      stream:      false,
      temperature: options.temperature || 0.7,
      top_p:       options.topP        || 0.9,
      num_predict: options.maxTokens   || 1024,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(this.baseUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Ollama error ${res.status}`);
      const data = await res.json();
      return data.response.trim();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError')
        throw new Error('Ollama timeout. Is it running at localhost:11434?');
      throw err;
    }
  }

  async rewriteAlternatives(text) {
    const prompt = `Generate exactly 5 different ways to express this text. Each must have a distinct tone or style.\n\nOriginal:\n"${text}"\n\nReturn ONLY valid JSON, no markdown:\n{\n  "variations": [\n    { "name": "Concise",       "text": "...", "purpose": "When brevity matters" },\n    { "name": "Technical",     "text": "...", "purpose": "For formal/professional use" },\n    { "name": "Conversational","text": "...", "purpose": "Friendly, casual tone" },\n    { "name": "Persuasive",    "text": "...", "purpose": "When you want to convince" },\n    { "name": "Narrative",     "text": "...", "purpose": "Story-like, engaging" }\n  ]\n}`;
    const raw = await this.generateText(prompt);
    try   { return JSON.parse(raw); }
    catch { return { variations: [{ name: 'Generated', text: raw, purpose: '' }] }; }
  }

  async summarize(text) {
    return this.generateText(
      `Summarize in 1-2 clear sentences. Keep the main idea.\n\n"${text}"`
    );
  }

  async explainSimply(text) {
    return this.generateText(
      `Explain simply (ELI5). Break down complex concepts. Assume no specialist knowledge.\n\n"${text}"`
    );
  }

  async alternatives(text) {
    return this.generateText(
      `Given this idea: "${text}"\n\nGenerate 5 different angles, perspectives, or related ideas. Numbered list.`
    );
  }

  async grammarPolish(text) {
    return this.generateText(
      `Fix grammar, improve clarity and flow. Keep original meaning and tone. Return ONLY the polished text.\n\n"${text}"`
    );
  }

  async formatAsBullets(text) {
    return this.generateText(
      `Convert to a clear bullet-point outline. Use sub-bullets for details.\n\n"${text}"`
    );
  }

  wordCountAndTime(text) {
    const words = text.trim().split(/\s+/).length;
    const mins  = Math.max(1, Math.ceil(words / 200));
    return {
      words,
      characters: text.length,
      readingTime: `${mins} min read`,
      summary: `${words} words \u2022 ${text.length} chars \u2022 ${mins} min read`,
    };
  }

  async testConnection() {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      if (!res.ok) return { success: false, error: 'Status ' + res.status };
      const data = await res.json();
      return { success: true, models: (data.models || []).map(m => m.name) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
