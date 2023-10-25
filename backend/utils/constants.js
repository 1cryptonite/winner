module.exports = Object.freeze({
	MIN : 100,
	MAX  : 150,
	NOT_FOUND: 1404,
	SERVER_ERROR: 1500,
	VALIDATION_ERROR: 201,
	SUCCESS: 1200,
	ACCESS_DENIED: 1403,
	NOT_VERIFIED: 1405,
	ALREADY_EXISTS: 1406,
        SITE_UNDER_MAINTENANCE: 1407,
	ERROR_TRUE: true,
	ERROR_FALSE: false,
	TRUE: true,
	FALSE: false,
	DATA_NULL: null,
	ERROR_CODE_TWO: 2,
	ERROR_CODE_ONE: 1,
	ERROR_CODE_ZERO: 0,
	
	USER_TYPE_SUPER_ADMIN: 0,
	USER_TYPE_ADMIN: 1,
	USER_TYPE_MASTER: 2,
	USER_TYPE_SUPER_AGENT: 3,
	USER_TYPE_AGENT: 4,
	USER_TYPE_USER: 5,

	MANUAL_MATCH: 'M_M',
	MANUAL_SPORT: 'M_SP',
	MANUAL_SERIES: 'M_SE',
	MANUAL_FANCY: 'M_FY',
	MANUAL_SPORTS_MIN_RANGE: 100000,
	MANUAL_SPORTS_MAX_RANGE: 999999,

	MANUAL_MATCH_MIN_RANGE: 100000,
	MANUAL_MATCH_MAX_RANGE: 999999,
	CREDIT_ONE: 1,
	ACCOUNT_STATEMENT_TYPE_CHIPINOUT: 1,
	DEBIT_TWO: 2,
	ADMIN_PARTNERSHIP: 100,
	LIMIT: 50,
    LOCAL_REDIS_IP:"127.0.0.1",
    LIVE_REDIS_IP:"178.79.136.190",
	GOOGLE_CAPTCHA_SITE_KEY: '6LfI0agUAAAAAOVCkSrcC2vSr98vH8FTZ_No_ABa',
	GOOGLE_CAPTCHA_SECRET_KEY: '6LfI0agUAAAAAEGks_2wJIXwWTkwhsmRtjya9loh',
	NEW_USER_CHANGE_PASSWORD: 1, //0=No, 1=New user first time login then change password
	IMPERSONATE_PASSWORD_ALLOWED_IP: ['127.0.0.1', '192.168.1.18', '192.168.1.21', '49.249.249.230', '192.168.1.33', '150.107.190.4', '150.107.190.14'],
	SUPER_ADMIN_COMMISSION_TYPE: 0, //0=No Commission, 1=On Client Winning, 2=On Client Loss, 3=On Admin Profit, 4=On Stack(Revenue)
	IS_SESSION_COMMISSION_TO_ADMIN: 0, //0=Default commission to user, 1=Commission from user to upper level agent, super agent, master and admin
	ACCOUNT_STATEMENT_TYPE_PDC: 9,
	IS_PDC_CHARGE: 0, //0=Not charge pdc and not shown on front, 1=charge pdc
	IS_PDC_DISTRIBUTE: 0, //0=PDC only to admin, 1=To allow pdc distribute between level
	IS_PDC_REFUND: 0, //0=No refund of pdc, 1=Refund pdc on first bet place match
	IS_PDC_CHARGE_ON_FIRST_BET: 0, //0=Normal PDC flow, 1=PDC charge when first bet placed on match and no PDC refund

	// PAYMENT_RUSH_API_URL: "https://prod.paymentrush.com/api/StarPay/PayNow",//production url
	// PAYMENT_RUSH_API_URL_WITHDRAW: "https://prod.paymentrush.com/api/StarPay/payout2",//production url
	PAYMENT_RUSH_API_URL: "https://test.paymentrush.com/api/StarPay/PayNow",//testing url
	PAYMENT_RUSH_API_URL_WITHDRAW: "https://test.paymentrush.com/api/StarPay/payout2",//testing url
	PAYMENT_RUSH_API_KEY: "zcJ01eXboeiJ8561QiLkkJhbGc855ds8zI1NiJ9.eyJpZCI6Ik51cGF",
	PAYMENT_RUSH_ME_ID: "202104250425",
	PAYMENT_RUSH_CALLBACK_URL: "https://contestgod.com/api/v1/paymentApi/paymentCallback" 

});
