export class BaseAgent {
  constructor(config) {
    if (!config?.id) throw new Error("Agent config requires an id.");
    this.config = config;
  }

  async run() {
    throw new Error("BaseAgent.run must be implemented by subclasses.");
  }
}
