const CONSTANTS = require('./constants');
const PDFDocument = require('pdfkit');
const PdfTable = require('voilab-pdf-table');

const randomIntFromInterval = (min, max) => {
	return Math.floor(
		Math.random() * (max - min + 1) + min
	);
};
const resultdb = (statusCode, data = null) => {
	return {
		statusCode: statusCode,
		data: data
	};
};

const apiSuccessRes = (req, res, message = CONSTANTS.DATA_NULL, data = CONSTANTS.DATA_NULL, code = CONSTANTS.ERROR_CODE_ZERO, error = CONSTANTS.ERROR_FALSE, token) => {

	return res.status(200).json({
		message: message,
		code: code,
		error: error,
		data: data,
		token: token
	});
};
const apiErrorRes = (req, res, message = CONSTANTS.DATA_NULL, data = CONSTANTS.DATA_NULL, code = CONSTANTS.ERROR_CODE_ONE, error = CONSTANTS.ERROR_TRUE) => {
	return res.status(200).json({
		message: message,
		code: code,
		error: error,
		data: data
	});
};

const currentDate = () => {
	return Date.now()/1000;
};

const printPDF = (req, res, pdfName,tabledata,fileData) => {
	//console.log('aaaaaaap',fileData);

	const doc = new PDFDocument();
	//font-size
	doc.fontSize(9)
   .fillColor('black');

	const table = new PdfTable(doc);
	let filename = encodeURIComponent(pdfName) + '.pdf';

	// add some plugins (here, a 'fit-to-width' for a column)
	table.addPlugin(new (require('voilab-pdf-table/plugins/fitcolumn'))({
		column: 'username'
	}));
	 // set defaults to your columns
	 table.setColumnsDefaults({
		headerBorder: ['L','B','R'],
        border: ['L','B','R'],
		align: 'center',
		padding: [5, 5, 5, 5]
	});
	// add table columns paased para
	table.addColumns(tabledata);
	// add events (here, we draw headers on each new page)

	table.onPageAdded(function (tb) {
		tb.addHeader();
	});

	table.addBody(fileData);
	//table.addBody();

	doc.pipe(res);
	doc.end();
	res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
	res.setHeader('Content-type', 'application/text');
	return res.download(filename);
};

//{"returnSet":{"token":"test-token","loginName":"Developer","currency":"INR","amount":0.0},"method":"getPlayerInfo","success":1}
const apiSuccessResVirtualGame = (req, res, method = "", returnSet = CONSTANTS.DATA_NULL) => {
	return res.status(200).json({
		success: 1,
		returnSet: returnSet,
		method: method
	});
};

//{"returnSet":{"errorCode":"101","errorMsg":"","token":""},"method":"getPlayerInfo","success":0}
const apiErrorResVirtualGame = (req, res, method = "", errorCode = "101", errorMsg = "Unknown Error !", token = "") => {
	return res.status(200).json({
		success: 0,
		returnSet: {errorCode: errorCode, errorMsg: errorMsg, token: token},
		method: method
	});
};

const isNotEmpty = (value) => typeof value != "undefined" && value != null && value.length != null
&& value.length > 0;


module.exports = {
	resultdb,
	apiSuccessRes,
	apiErrorRes,
	apiSuccessResVirtualGame,
	apiErrorResVirtualGame,
	randomIntFromInterval,
	currentDate,
	printPDF,
	isNotEmpty
};