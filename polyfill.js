const util = require('util');

if (!util.styleText) {
  util.styleText = function(style, text) {
    const styles = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
      bold: '\x1b[1m',
      reset: '\x1b[0m'
    };
    
    let start = '';
    const end = '\x1b[0m';
    
    if (Array.isArray(style)) {
      for (const s of style) {
        if (styles[s]) start += styles[s];
      }
    } else if (styles[style]) {
      start = styles[style];
    }
    
    return start + text + end;
  };
}

if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}
