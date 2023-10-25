const interval = require('interval-promise');
const settings = require('../config/settings');
const mysql_pool = require('../db/index');
const client = require('../db/redis');
const globalFunction = require('../utils/globalFunction');
const marketsService = require('../routes/services/marketsService');
const betService = require('../routes/services/betsService');
const selectionService = require('../routes/services/selectionService');
let axios = require('axios');


let markets =[];
let sportData =[];
let last_20_20_market_id=0;
let last_20_20_results=[];
let last_one_day_market_id=0;
let last_one_day_result=[];
let last_test_market_id=0;
let last_test_result=[];


let golabBetfairOddsFormate ={"betDelay": 0,"bspReconciled":false,"complete":true,"crossMatching":true,"inplay":true,"isMarketDataDelayed":false,"numberOfActiveRunners":3,"numberOfRunners":3,"numberOfWinners":1,"runnersVoidable":false,"status":'OPEN',"totalAvailable":1,"totalMatched":2,"version":1,"cards":[],"results":[],"autotime":0};


async function getListOfMarketIdFromDatabase ()  {
    let result = await mysql_pool.query('select market_id from markets');
    markets = result.map(function (elem) {
        return (elem.market_id);
    });
}

async function getteenpattidata20() {
    let responce = await axios.get(settings.TEEN_PATTI+'getteenpattidata20');
    let selections= _selections_2020;
    selections =selections.data;
    try {

        if(!(markets.includes(responce.data.t1[0].mid)) && responce.data.t1[0].mid > 0) {
            let mid = responce.data.t1[0].mid;
            markets.push(mid);


            let arraydata = [];

            let backdefault = [
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                }
            ];
            let layDefault = [
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                }
            ];

            for (let i in selections) {
                arraydata.push({
                    selectionId: selections[i].selection_id,
                    name: selections[i].name,
                    back: backdefault,
                    lay: layDefault
                });

            }
            let reqdaa = {
                sport_id: -1,
                series_id: -1,
                match_id: -1,
                market_id: mid,
                name: "Match Odds",
                is_manual: 0,
                create_at: globalFunction.currentDate(),
                update_at: globalFunction.currentDate(),
                runner_json: JSON.stringify(arraydata)
            };
           // marketsService.createMarket(reqdaa);

            let resultResponce = await axios.get(settings.TEEN_PATTI+'getteenpattiresult20');
            last_20_20_results = resultResponce.data;
            last_20_20_results.map(function (d) {
                let k = selections.findIndex(x => x.selection_id ==d.result);
                try {
                    d.selection_id = d.result;
                    d.result = selections[k].name.split(" ")[1];
                } catch (e) {
                }
                return d
            });
            resultResponce = resultResponce.data[0];

            let selectionNameData = await selectionService.getNameBySelectionId(resultResponce.selection_id);

            await betService.getResultOdds(reqdaa.sport_id, reqdaa.match_id, resultResponce.mid, resultResponce.selection_id, 'Teen Patti', '20-20', reqdaa.name, selectionNameData.data.name);
            await client.del("ODDS_" + resultResponce.mid);

        }
        else {
            let t1 = responce.data.t1[0];
            golabBetfairOddsFormate.autotime = responce.data.t1[0].autotime;
            mid = responce.data.t1[0].mid;
            let runners = [];
            if (mid > 0) {
                last_20_20_market_id = mid;

                golabBetfairOddsFormate.marketId = mid;
                golabBetfairOddsFormate.results = last_20_20_results;
                golabBetfairOddsFormate.cards=[[t1.C1,t1.C2,t1.C3],[t1.C4,t1.C5,t1.C6]];
                for (let index in selections){
                   let  data = selections[index];
                    if (index == 0) {
                        runners.push({
                            "totalMatched": 0,
                            "selectionId": data.selection_id,
                            "status": 0,
                            "handicap": 0,
                            "ex": {
                                "availableToBack": [{"size": 0, "price": Number(responce.data.t2[0].rate),"status": responce.data.t2[0].gstatus}],
                                "availableToLay": [{"size": 0, "price": responce.data.t2[1].nation,"status": responce.data.t2[1].gstatus}]
                            }
                        })

                    } else {
                        runners.push({
                            "totalMatched": 0,
                            "selectionId": data.selection_id,
                            "status":0,
                            "handicap": 0,
                            "ex": {
                                "availableToBack": [{"size": 0, "price": Number(responce.data.t2[2].rate),"status": responce.data.t2[2].gstatus}],
                                "availableToLay": [{"size": 0, "price": responce.data.t2[3].nation,"status": responce.data.t2[3].gstatus}]
                            }
                        })
                    }
                }
                golabBetfairOddsFormate.runners = runners;
                //await client.set("ODDS_" + mid, JSON.stringify(golabBetfairOddsFormate));
            }else{
                golabBetfairOddsFormate.marketId = last_20_20_market_id;
                golabBetfairOddsFormate.results = last_20_20_results;
                golabBetfairOddsFormate.cards=[];
                selections.map(function (data, index) {
                    if (index == 0) {
                        runners.push({
                            "totalMatched": 0,
                            "selectionId": data.selection_id,
                            "status": 0,
                            "handicap": 0,
                            "ex": {
                                "availableToBack": [{"size": 0, "price": 0,"status": 0}],
                                "availableToLay": [{"size": 0, "price": 0,"status": 0}]
                            }
                        })

                    } else {
                        runners.push({
                            "totalMatched": 0,
                            "selectionId": data.selection_id,
                            "status": 0,
                            "handicap": 0,
                            "ex": {
                                "availableToBack": [{"size": 0, "price": 0,"status": 0}],
                                "availableToLay": [{"size": 0, "price": 0,"status": 0}]
                            }
                        })
                    }

                });
                golabBetfairOddsFormate.runners = runners;
               // console.log(golabBetfairOddsFormate.runners);

               // await client.set("ODDS_" + last_20_20_market_id, JSON.stringify(golabBetfairOddsFormate));
            }

        }
    } catch (e) {
    }


}

async function getteenpattidataOneDay() {

    let responce = await axios.get(settings.TEEN_PATTI+'getteenpattidataoneday');
    let selections= _selections_one_day;
    selections =selections.data;
    try {
        if ((responce.data[0].marketId) && !(markets.includes(responce.data[0].marketId)) && responce.data[0].marketId > 0) {
            let mid = responce.data[0].marketId;
            markets.push(mid);

            let arraydata = [];

            let backdefault = [
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                }
            ];
            let layDefault = [
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                }
            ];

            for (let i in selections) {
                arraydata.push({
                    selectionId: selections[i].selection_id,
                    name: selections[i].name,
                    back: backdefault,
                    lay: layDefault
                });

            }
            let reqdaa = {
                sport_id: -1,
                series_id: -1,
                match_id: -2,
                market_id: mid,
                name: "Match Odds",
                is_manual: 0,
                create_at: globalFunction.currentDate(),
                update_at: globalFunction.currentDate(),
                runner_json: JSON.stringify(arraydata)
            };
            marketsService.createMarket(reqdaa);

            let resultResponce = await axios.get(settings.TEEN_PATTI+'getteenpattiresultoneday');
            last_one_day_result = resultResponce.data;

            last_one_day_result.map(function (d) {
                let k = selections.findIndex(x => x.selection_id ==d.result);
                d.selection_id = d.result;
                return d.result = selections[k].name.split(" ")[1];
            });

            resultResponce = resultResponce.data[0];

            let selectionNameData = await selectionService.getNameBySelectionId(resultResponce.selection_id);

            betService.getResultOdds(reqdaa.sport_id, reqdaa.match_id, resultResponce.mid, resultResponce.selection_id, 'Teen Patti', '1 day', reqdaa.name, selectionNameData.data.name);
            client.del("ODDS_" + resultResponce.mid);
            /* await mysql_pool.query('update markets  set is_result_declared ="1" where market_id=' + last_one_day_market_id);*/
        }
        else {

            mid = responce.data[0].marketId;
            golabBetfairOddsFormate.autotime = responce.data[0].UpdateTime;
            if (mid > 0) {
                last_one_day_market_id = mid;
                let runners = [];
                golabBetfairOddsFormate.results = last_one_day_result;
                golabBetfairOddsFormate.marketId = mid;
                let cards=[];
                selections.map(function (data,index) {
                    cards.push([responce.data[index].C1,responce.data[index].C2,responce.data[index].C3]);
                    runners.push({
                        "totalMatched": 0,
                        "selectionId": data.selection_id,
                        "status": '',
                        "handicap": responce.data[index].gstatus,
                        "ex": {
                            "availableToBack": [{"size": responce.data[index].bs1, "price": Number(responce.data[index].b1)/100,"status": responce.data[index].gstatus}],
                            "availableToLay": [{"size": responce.data[index].ls1, "price": Number(responce.data[index].l1)/100,"status": responce.data[index].gstatus}]
                        }
                    })
                });
                golabBetfairOddsFormate.runners = runners;
                golabBetfairOddsFormate.cards =cards;
                //await client.set("ODDS_" + mid, JSON.stringify(golabBetfairOddsFormate));
            }else {
                //  console.log("dsfkdasjfljsdfdsfadsfdsfdsfdsfdsfdsfsd");
                let runners = [];
                golabBetfairOddsFormate.results = last_one_day_result;
                golabBetfairOddsFormate.marketId = last_one_day_market_id;

                selections.map(function (data) {
                    runners.push({
                        "totalMatched": 0,
                        "selectionId": data.selection_id,
                        "status": 0,
                        "handicap": 0,
                        "ex": {
                            "availableToBack": [{"size": 0, "price": 0,"status": 0}],
                            "availableToLay": [{"size": 0, "price": 0,"status": 0}]
                        }
                    })
                });
                golabBetfairOddsFormate.runners = runners;
                //await client.set("ODDS_" + last_one_day_market_id, JSON.stringify(golabBetfairOddsFormate));
            }

        }
    } catch (e) {
    }


}

async function getteenpattidataTest() {
    let responce = await axios.get(settings.TEEN_PATTI+'getteenpattidatatest');
    let   selections =_selections_test.data;
    try {

        if (!(markets.includes(responce.data.t1[0].mid)) && responce.data.t1[0].mid > 0 ) {
            let mid = responce.data.t1[0].mid;
            markets.push(mid);

            let arraydata = [];

            let backdefault = [
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                }
            ];
            let layDefault = [
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                },
                {
                    'size': '--',
                    'price': '--'
                }
            ];

            for (let i in selections) {
                arraydata.push({
                    selectionId: selections[i].selection_id,
                    name: selections[i].name,
                    back: backdefault,
                    lay: layDefault
                });

            }

            let reqdaa = {
                sport_id: -1,
                series_id: -1,
                match_id: -3,
                market_id: mid,
                name: "Match Odds",
                is_manual: 0,
                create_at: globalFunction.currentDate(),
                update_at: globalFunction.currentDate(),
                runner_json: JSON.stringify(arraydata)
            };
            await marketsService.createMarket(reqdaa);

            let resultResponce = await axios.get(settings.TEEN_PATTI+'getteenpattiresulttest');
            last_test_result = resultResponce.data;
            //console.log("asfsvvvvvvvvvvvvvvvvvvvvvvvdfds",selections);
            last_test_result.map(function (d) {
                let k = _selections_test_all.data.findIndex(x => x.selection_id ==d.result);
                try {
                    d.selection_id = d.result;
                    d.result = _selections_test_all.data[k].name.split("")[1];
                    return d;
                } catch (e) {

                }
            });

            resultResponce = resultResponce.data[0];

            let selectionNameData = await selectionService.getNameBySelectionId(resultResponce.selection_id);

            betService.getResultOdds(reqdaa.sport_id, reqdaa.match_id, resultResponce.mid, resultResponce.selection_id, 'Teen Patti', 'Test', reqdaa.name, selectionNameData.data.name);
            //console.log(reqdaa.sport_id, reqdaa.match_id, resultResponce.mid, resultResponce.selection_id, 'Teen Patti', 'Test', reqdaa.name, selectionNameData.data.name);
            client.del("ODDS_" + resultResponce.mid);

        }
        else {
            let t1 = responce.data.t1[0];
            mid = responce.data.t1[0].mid;
            golabBetfairOddsFormate.autotime = responce.data.t1[0].autotime;
            if (mid > 0) {
                last_test_market_id = mid;
                let runners = [];
                golabBetfairOddsFormate.marketId = mid;
                golabBetfairOddsFormate.cards=[[t1.C1,t1.C2,t1.C3],[t1.C4,t1.C5,t1.C6],[t1.C7,t1.C8,t1.C9]];
                responce.data.t2.map(function (data) {
                    runners.push({
                            "totalMatched": 0,
                            "selectionId": data.tsection,
                            "status": data.tstatus,
                            "handicap": 0,
                            "ex": {
                                "availableToBack": [{"size": 0, "price": Number(data.trate),"status":data.tstatus},{"size": 0, "price": Number(data.drate),"status":data.dstatus},{ "size": 0, "price": Number(data.lrate),"status":data.lstatus }],
                                "availableToLay": []
                            }
                        }
                    )
                });
                golabBetfairOddsFormate.runners = runners;
                 await client.set("ODDS_" + mid, JSON.stringify(golabBetfairOddsFormate));
            }else {

                let runners = [];
                golabBetfairOddsFormate.marketId = last_test_market_id;
                golabBetfairOddsFormate.cards=[];
                responce.data.t2.map(function (data) {
                    runners.push({
                            "totalMatched": 0,
                            "selectionId": data.tsection,
                            "status": 0,
                            "handicap": 0,
                            "ex": {
                                "availableToBack": [{"size": 0, "price": 0,"status":0},{"size": 0, "price": 0,"status":0},{ "size": 0, "price":0,"status":0 }],
                                "availableToLay": []
                            }
                        }
                    )
                });
                golabBetfairOddsFormate.runners = runners;
                 await client.set("ODDS_" + last_test_market_id, JSON.stringify(golabBetfairOddsFormate));
            }

        }
    } catch (e) {
    }


}

async function teenPattiOddsGlobal() {
    await  getListOfMarketIdFromDatabase();
    // for getteenpattidata20
    global._selections_2020= await selectionService.getSelectionByMatchId(-1);

    // for getteenpattidata20 result
    let resultResponce20 = await axios.get(settings.TEEN_PATTI+'getteenpattiresult20');
    last_20_20_results =resultResponce20  = resultResponce20.data;
    for(let t20 in resultResponce20){
        let responce20 = resultResponce20[t20];
        try {
            let selectionNameData20 = await selectionService.getNameBySelectionId(responce20.result);
            betService.getResultOdds(-1, -1, responce20.mid, responce20.result, 'Teen Patti', '20-20', 'Match Odds', selectionNameData20.data.name);
        } catch (e) {
        }
       // client.del("ODDS_" + responce20.mid);
    }

    last_20_20_results.map(function (d) {
        let k = _selections_2020.data.findIndex(x => x.selection_id ==d.result);
        try {
            d.result = _selections_2020.data[k].name.split(" ")[1];
        } catch (e) {

        }
        return d;
    });

    // for _selections_one_day
    global._selections_one_day= await selectionService.getSelectionByMatchId(-2);
    // for _selections_one_day result
    let resultResponce1day = await axios.get(settings.TEEN_PATTI+'getteenpattiresultoneday');
    last_one_day_result =resultResponce1day  = resultResponce1day.data;

    last_one_day_result.map(function (d) {
        try {
            let k = _selections_one_day.data.findIndex(x => x.selection_id == d.result);
             d.result = _selections_one_day.data[k].name.split(" ")[1];
        } catch (e) {
        }
        return d
    });

    for(let day in resultResponce1day){
        let responce1day = resultResponce1day[day];
        try {
            let selectionNameData1day = await selectionService.getNameBySelectionId(responce1day.result);
            betService.getResultOdds(-1, -2, responce1day.mid, responce1day.result, 'Teen Patti', '1day', 'Match Odds', selectionNameData1day.data.name);
            client.del("ODDS_" + responce1day.mid);
        } catch (e) {
        }
    }

    // for _selections_test
    global._selections_test= await selectionService.getAlternativeByMatchId(-3,3);
    global._selections_test_all= await selectionService.getSelectionByMatchId(-3);
    // for _selections_test result
    let resultResponceTest = await axios.get(settings.TEEN_PATTI+'getteenpattiresulttest');

    last_test_result.map(function (d) {
        let k = _selections_test_all.data.findIndex(x => x.selection_id ==d.result);
        try {
            d.selection_id = d.result;
            d.result = _selections_test_all.data[k].name.split("")[1];
            return d;
        } catch (e) {

        }
    });

    resultResponceTest = resultResponceTest.data;
    for(let t in resultResponceTest){
        let responceTest = resultResponceTest[t];
        try {
            let selectionNameDataTest = await selectionService.getNameBySelectionId(responceTest.result);
            betService.getResultOdds(-1, -3, responceTest.mid, responceTest.result, 'Teen Patti', 'Test', 'Match Odds', selectionNameDataTest.data.name);
        } catch (e) {
        }
        //client.del("ODDS_" + responceTest.mid);
    }



    interval(async () => {
        getteenpattidata20();
        getteenpattidataOneDay();
        getteenpattidataTest();
    }, 1000);
}

module.exports = teenPattiOddsGlobal;