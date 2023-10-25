/**
 * Configurations of logger.
 */
const winston = require('winston');
const winstonRotator = require('winston-daily-rotate-file');
//const settings = require('./../config/settings');
const moment = require('moment');

const logsCurrentFolder = process.env.PWD;
const consoleConfig = [
	new winston.transports.Console({
		'colorize': true
	})
];
const createLogger = new winston.Logger({
	level: 'info',
	transports: consoleConfig
});
const successLogger = createLogger;

if (process.env.NODE_ENV !== 'production') {
	successLogger.add(winstonRotator, {
		'name': 'access-file',
		'level': 'info',
		'filename': logsCurrentFolder + '/logs/access.log',
		'json': true,
		'zippedArchive': true,
		'maxSize': '20m',
		'maxFiles': '3d',
		'datePattern': 'YYYY-MM-DD',
		'prepend': true,
		'timestamp': () => {
			return moment().format('YYYY-MM-DD hh:mm:ss');
		}
	});
}

const errorLogger = createLogger;
if (process.env.NODE_ENV !== 'production') {
	errorLogger.add(winstonRotator, {
		'name': 'error-file',
		'level': 'error',
		'filename': logsCurrentFolder + '/logs/error.log',
		'json': true,
		'zippedArchive': true,
		'maxSize': '20m',
		'maxFiles': '3d',
		'datePattern': 'YYYY-MM-DD',
		'prepend': true,
		'timestamp': () => {
			return moment().format('YYYY-MM-DD hh:mm:ss');
		}
	});
}

module.exports = {
	'successlog': successLogger,
	'errorlog': errorLogger
};
