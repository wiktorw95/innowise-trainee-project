export class AppLogger {
  // ANSI Color Codes for the terminal
  private static colors = {
    reset: '\x1b[0m',
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    debug: '\x1b[35m', // Magenta
  };

  private static formatMessage(
    level: string,
    color: string,
    message: string,
    context?: string
  ) {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}] ` : '';
    return `${color}[${timestamp}] [${level}] ${ctx}${message}${this.colors.reset}`;
  }

  static info(message: string, context?: string) {
    console.log(this.formatMessage('INFO', this.colors.info, message, context));
  }

  static success(message: string, context?: string) {
    console.log(
      this.formatMessage('SUCCESS', this.colors.success, message, context)
    );
  }

  static warn(message: string, context?: string) {
    console.warn(
      this.formatMessage('WARN', this.colors.warn, message, context)
    );
  }

  static error(message: string, trace?: unknown, context?: string) {
    console.error(
      this.formatMessage('ERROR', this.colors.error, message, context)
    );
    if (trace) console.error(trace);
  }

  static debug(message: string, data?: unknown, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        this.formatMessage('DEBUG', this.colors.debug, message, context)
      );
      if (data) console.dir(data, { depth: null, colors: true });
    }
  }
}
