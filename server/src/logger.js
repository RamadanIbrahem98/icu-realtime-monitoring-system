const colors = require('colors');

colors.setTheme({
  SILLY: 'rainbow',
  INPUT: 'grey',
  VERBOSE: 'cyan',
  PROMPT: 'grey',
  INFO: 'green',
  DATA: 'grey',
  HELP: 'cyan',
  WARNING: 'yellow',
  DEBUG: 'blue',
  ERROR: 'red',
});

const logTime = () => {
  const now = new Date();
  const time = `${now.getFullYear()}-${now.getMonth()}-${now.getDay()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  return time;
};

const logger = (level, type, message) => {
  console.log(`[${logTime()}] - [${type}]: ${message}`[level]);
};

module.exports = {
  logger,
};
