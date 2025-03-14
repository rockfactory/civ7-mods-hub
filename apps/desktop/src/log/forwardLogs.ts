import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';

function forwardConsole(
  fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
  logger: (message: string) => Promise<void>
) {
  const original = console[fnName];
  console[fnName] = (...args) => {
    original(...args);
    logger(args.join(' '));
  };
}

forwardConsole('debug', trace);
forwardConsole('log', debug);
forwardConsole('info', info);
forwardConsole('warn', warn);
forwardConsole('error', error);
