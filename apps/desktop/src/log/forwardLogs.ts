import { invoke } from '@tauri-apps/api/core';
import {
  warn,
  debug,
  trace,
  info,
  error,
  LogOptions,
} from '@tauri-apps/plugin-log';

function forwardConsole(
  fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
  logger: (message: string) => Promise<void>
) {
  const original = console[fnName];
  console[fnName] = (...args) => {
    original(...args);

    logger(
      args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ')
    );
  };
}

// This is needed since it's not exported from the plugin-log package
enum LogLevel {
  trace = 1,
  debug = 2,
  info = 3,
  warn = 4,
  error = 5,
}

/**
 * We remap internally the plugin:log log command, to avoid logging useless
 * stack (location) in the log file
 */
function logFn(level: LogLevel) {
  return async (message: string, options?: LogOptions) => {
    const { file, line, keyValues } = options || {};
    await invoke('plugin:log|log', {
      level,
      message,
      location: undefined,
      file,
      line,
      keyValues,
    });
  };
}

forwardConsole('debug', logFn(LogLevel.trace));
forwardConsole('log', logFn(LogLevel.debug));
forwardConsole('info', logFn(LogLevel.info));
forwardConsole('warn', logFn(LogLevel.warn));
forwardConsole('error', logFn(LogLevel.error));
