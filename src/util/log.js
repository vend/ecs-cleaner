import fs from 'fs';
import util from 'util';

export class Log {
  static levels = {
    error: 0,
    warning: 1,
    notice: 2,
    info: 3,
    debug: 4,
  };

  static level = 1;
  static out = process.stderr;
  static file = null;
  static color = true;

  static setLevel(level) {
    Log.level = level;
  }

  static setColor(color = true) {
    Log.color = color;
  }

  static setFile(file) {
    if (Log.out && Log.out !== process.stderr) {
      Log.out.end();
    }

    Log.out = fs.createWriteStream(file, {flags: 'a'});
  }

  static label(level) {
    return Object.keys(Log.levels)[level];
  }

  static log(message, level = 2, ...context) {
    if (level > Log.level) {
      console.log('Log omitted', level, ' is gt ', Log.level);
      return;
    }

    Log._doLog(message, level, ...context);
  }

  static _doLog(message, level, ...context) {
    const levelString = Log.label(level);

    const contextString = context.map((c) => {
      if (typeof c === 'undefined') {
        return null;
      }

      return util.inspect(c, {
        colors: Log.color,
      });
    });

    Log._write(`[${levelString}] ${message} ${contextString.join(' | ')}\n`);
  }

  static _write(string) {
    Log.out.write(string);
  }
}

export const error = (message, context) => Log.log(message, Log.levels.error, context);
export const warning = (message, context) => Log.log(message, Log.levels.warning, context);
export const notice = (message, context) => Log.log(message, Log.levels.notice, context);
export const info = (message, context) => Log.log(message, Log.levels.info, context);
export const debug = (message, context) => Log.log(message, Log.levels.debug, context);

/**
 * @namespace log
 */
export default {
  log: Log.log,
  Log: Log,

  error: error,
  warning: warning,
  notice: notice,
  info: info,
  debug: debug,
};
