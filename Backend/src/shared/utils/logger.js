const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  },
  error: (message, trace) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, trace || '');
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }
};

module.exports = logger;
