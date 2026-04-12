export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.info(`[wenyan-agent] ${message}`, context ?? "");
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[wenyan-agent] ${message}`, context ?? "");
  },
  error(message: string, context?: Record<string, unknown>) {
    console.error(`[wenyan-agent] ${message}`, context ?? "");
  }
};