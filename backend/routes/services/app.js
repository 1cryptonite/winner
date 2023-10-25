const  express = require('express');
const  https = require('https');
const  fs = require('fs');
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');
const settings = require('./config/settings');
const cors = require('cors');
const routes = require('./routes');
const morgan = require('morgan');
const jwt = require('./routes/middlewares/jwt');//Token for User
const middleware = require('./routes/middlewares/middleware'); //Token for loadGlobalSetting
const errorHandler = require('./utils/error_handler');
const sessionGlobal = require('./utils/sessionGlobal');
const oddsGlobal = require('./utils/oddsGlobal');
const teenPattiGlobal = require('./utils/teenPattiGlobal');
const loadGlobalSetting = require('./utils/loadGlobalSetting');
const logger = require('../../utils/logger');
const blacklistToken = require('./utils/blacklistToken');
const path = require('path');

const successlog = logger.successlog;
const userController = routes.userController;
const marketsController = routes.marketsController;
const matchesController = routes.matchesController;
const seriesController = routes.seriesController;
const sportsController = routes.sportsController;
const fancyController = routes.fancyController;
const accountStatementsController = routes.accountStatementsController;
const globalSettingController = routes.globalSettingController;
const betsController = routes.betsController;
const userSettingController = routes.userSettingController;
const exchangeController = routes.exchangeController;
const reportController = routes.reportController;
const scoreController = routes.scoreController;
const notificationsController = routes.notificationsController;
const apkController = routes.apkController;
const subAdminRolesController = routes.subAdminRolesController;
const subAdminController = routes.subAdminController;
const resultController = routes.resultController;
//Onload get data from global table load in memory.
global._blacklistToken=[];
global._loggedInToken=[];
(async () => {
	try {
		await loadGlobalSetting();
		//await sessionGlobal();
		//await oddsGlobal();
		// await teenPattiGlobal();
		await blacklistToken.removeToken();
	} catch (error) {
		console.log("error  ",error);
		process.exit();
	}
})();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const app = express();
app.set('views', path.join(__dirname, 'routes/view'));
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.json());
app.use(middleware);

app.use("/view/token",function (req,res,errror) {
	return res.render('token');
});

app.use(jwt());
app.use(errorHandler);
app.enable('trust proxy');
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(morgan('dev', {
	skip: function (req, res) {
		return res.statusCode < 400;
	},
	stream: process.stderr
}));
app.use(morgan('dev', {
	skip: function (req, res) {
		return res.statusCode >= 400;
	},
	stream: process.stdout
}));
app.use(fileupload({
	limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(settings.API_URL, userController);
app.use(settings.API_URL, marketsController);
app.use(settings.API_URL, matchesController);
app.use(settings.API_URL, seriesController);
app.use(settings.API_URL, sportsController);
app.use(settings.API_URL, fancyController);
app.use(settings.API_URL, accountStatementsController);
app.use(settings.API_URL, globalSettingController);
app.use(settings.API_URL, betsController);
app.use(settings.API_URL, userSettingController);
app.use(settings.API_URL, exchangeController);
app.use(settings.API_URL, reportController);
app.use(settings.API_URL, scoreController);
app.use(settings.API_URL, notificationsController);
app.use(settings.API_URL, apkController);
app.use(settings.API_URL, subAdminRolesController);
app.use(settings.API_URL, subAdminController);
app.use(settings.API_URL, resultController);
app.listen(settings.PORT1, function () {
	successlog.info('Running at PORT  ' + settings.PORT1);
});

/*
var options = {
    key: fs.readFileSync('/etc/ssl/private/99betfair.key'),
    cert: fs.readFileSync('/etc/ssl/certs/vb1.crt'),
};


let server = https.createServer(options, app).listen(settings.PORT1, function(){
    console.log("Express server listening on port " + settings.PORT1);
});
*/
