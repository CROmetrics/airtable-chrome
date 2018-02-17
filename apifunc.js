let trellomembers, trellokey, trellotoken;;

//Airtable Calls
function getBaseJson() {
    var records = [];

    let requestsArray = urlArray.map((url) => {
        let request = new Request(url, {
            headers: new Headers({
                'Content-Type': 'text/json'
            }),
            method: 'GET'
        });

        return request;
    });
    
    //Fire off series of promises to get tests out of various airtable bases
    Promise.all(requestsArray.map((request) => {
        return fetch(request).then((response) => {
            return response.json();
        }).then((data) => {
            //console.log(data);
            data.baseid = request.url.substring(request.url.lastIndexOf("v0/") + 3, request.url.lastIndexOf("/"))
            return data;

        });
    })).then((values) => {
        
        //Merge all the testing into a single array
        values.map((item) => {
            for (let i = item.records.length - 1; i >= 0; i--) {
                item.records[i].baseid = item.baseid;
                //Pull out trello card id
                if (item.records[i].fields["Trello Link"]) {
                    var startpos = item.records[i].fields["Trello Link"].indexOf('/c/') + 3;
                    var endpos = item.records[i].fields["Trello Link"].indexOf('/', startpos + 1);
                    item.records[i].trelloid = item.records[i].fields["Trello Link"].substr(startpos, endpos - startpos);
                }
                records.push(item.records[i]);
            }            
        });
        alltests = records;
        
        //Pull out test that we want to scan for transition to QA or Done Ready
        cardstoscan = _.filter(alltests, function (c) {
            return c.fields.Status === "In QA" || c.fields.Status === "Implementation";
        });
        
        //Fire off more promises to scan each card to see what list it's on now
        Promise.all(cardstoscan.map((test) => {
            return ScanCard(test.trelloid).then((response) => {
                return response;
            }).then((data) => {
                
                let Status = test.fields.Status;
                let BaseId = test.baseid;
                let RecId = test.id;
                data.id = test.id;
                if (data !== "no change" && test.fields.Status !== data.status) {
                   //update airtable record
                   UpdateAtRecord('Status', data.status, BaseId, RecId);  
                   UpdateAtRecord('ExperimentId', data.exid, BaseId, RecId);                
                }
                return data;                
            })
        })).then((values) => {
            console.log(values);
            alltests.map(function (test) {
                values.map(function (utest) {
                    if (utest !== "no change") {                        
                        if (test.id === utest.id) {                            
                            if( test.fields.Status !== utest.status) {
                                //update main array object status                                
                                test.fields.Status = utest.status;      
                                test.fields.ExperimentId = utest.exid;                     
                            }
                            
                        }
                    }
                });

            });
                        
            bindTests(alltests);
        });

        
    });


}

function UpdateAtRecord(recordname, value, baseid, recid, callback) {

    var x = new XMLHttpRequest();
    x.open('PATCH', 'https://api.airtable.com/v0/' + baseid + '/Roadmap/' + recid + '?api_key=' + apikey);
    x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    x.onload = function () {
        //console.log(x);
        json = JSON.parse(x.responseText);
        if (json.error) {
            alert(json.error.type);
        }
        return callback();
    };
    x.send(JSON.stringify({ fields: { [recordname]: value } }));
}


//Trello Calls
function GetImplementationLists(callback) {
    var data = JSON.stringify(false);
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.addEventListener("readystatechange", function () {
        //this fires after trello board is read
        if (this.readyState === this.DONE) {
            let lists = JSON.parse(this.responseText);
            let listurl = 'https://api.trello.com/1/lists/{listid}/cards?key=' + trellokey + '&token=' + trellotoken;
            //Use the lists info to build api calls to get card count in each list
            let requestsArray = lists.map((list) => {
                console.log(list);
                let request = new Request(listurl.replace('{listid}', list.id, listurl), {
                    headers: new Headers({
                        'Content-Type': 'text/json'
                    }),
                    method: 'GET'
                });
                request.name = list.name;
                request.id = list.id;
                request.idBoard = list.idBoard;
                return request;
            });

            Promise.all(requestsArray.map((request) => {
                return fetch(request).then((response) => {
                    return response.json();
                }).then((data) => {

                    let dataObj = {};
                    dataObj.name = request.name;
                    dataObj.data = data.length;
                    dataObj.id = request.id;
                    dataObj.idBoard = request.idBoard;
                    return dataObj;
                });
            })).then((values) => {
                //console.log(values);       
                callback(values);
            }).catch(console.error.bind(console));
        }
    });

    xhr.open("GET", "https://api.trello.com/1/boards/chLoHyqs/lists?key=" + trellokey + "&token=" + trellotoken);
    xhr.send(data);
}

function AddMemberToCard(cardid, memberId) {
    var data = JSON.stringify(false);
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            console.log(this.responseText);

        }
    });

    xhr.open("POST", "https://api.trello.com/1/cards/" + cardid + "/idMembers?value=" + memberId + "&key=" + trellokey + "&token=" + trellotoken);
    xhr.send(data);
}

function MoveCard(cardid, listid, memberToAdd, username, comment, due, callback) {
    console.log(trellokey);
    var duedate;
    if (due) {
        duedate = due;
    } else {
        var date = new Date();
        date.setDate(date.getDate() + 3);
        if(date.getDay() === 1) {
            date.setDate(date.getDate() + 1);
        } else if (date.getDay() === 0) {
            date.setDate(date.getDate() + 2);
        } else if (date.getDay() === 6) {
            date.setDate(date.getDate() + 3);
        }
        var duedate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    var data = JSON.stringify(false);

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            //console.log(this);
            AddMemberToCard(cardid, memberToAdd);
            AddTrelloComment(username, cardid, comment);
        }
    });

    xhr.open("PUT", "https://api.trello.com/1/cards/" + cardid + "?idList=" + listid + "&idBoard=54f4ad49bb26fe25381f2048&due=" + duedate + "&key=" + trellokey + "&token=" + trellotoken);
    xhr.send(data);

}

function GetTrelloMembers() {
    const orgid = '51ae3b0fe6c311dd13000de0';
    var data = null;
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            members = JSON.parse(this.responseText);
            trellomembers = members;
        }
    });

    xhr.open("GET", "https://api.trello.com/1/organizations/51ae3b0fe6c311dd13000de0/members?filter=all&fields=all&key=" + trellokey + "&token=" + trellotoken);
    xhr.send(data);
}

function AddTrelloComment(username, cardid, comment) {
    var data = null;
    var xhr = new XMLHttpRequest();
    if (comment.length < 1) {
        comment =     "here's another one for the queue. Let me know if any questions. Thanks!";

    }
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            console.log(this.responseText);
        }
    });
    comment = encodeURIComponent("@" + username + " " + comment);

    xhr.open("POST", "https://api.trello.com/1/cards/" + cardid + "/actions/comments?text=" + comment + "&key=" + trellokey + "&token=" + trellotoken);
    xhr.send(data);
}

function GetExperimentId(cardid, callback) {
    var data = null;
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            let desc = JSON.parse(this.responseText)._value;
            let exposition = desc.indexOf('/experiments/') + 13;
            let endposition = desc.indexOf('\n', exposition);
            let exlength = endposition - exposition;
            return callback(desc.substr(exposition, exlength));
        }
    });

    xhr.open("GET", "https://api.trello.com/1/cards/" + cardid + "/desc?key=" + trellokey + "&token=" + trellotoken);
    xhr.send(data);
}

function ScanCard(cardid) {
    return new Promise(function (resolve, reject) {
        var data = null;
        var xhr = new XMLHttpRequest();
        var test = {};
        xhr.addEventListener("readystatechange", function () {
            
            if (this.readyState === this.DONE) {
                let card = JSON.parse(this.responseText);
                console.log(card);
                let desc = card.desc;
                let exposition = desc.indexOf('/experiments/') + 13;
                let endposition = desc.indexOf('\n', exposition);
                let exlength = endposition - exposition;
                //console.log('card:' + card);
                if (card.idList === "595d2dba6c4bd076d7b6c7b8" || card.idList === "5806175db43e2efadf7c1935") {
                    test.status = "In QA";
                    test.exid = desc.substr(exposition, exlength);
                    //test.id = card.id;
                    return resolve(test);
                } else if (card.idList === "54f4ad58842c59cc3798bcf7") {
                    test.status = "Pending Approval";
                    test.exid = desc.substr(exposition, exlength);
                    //test.id = card.id;
                    return resolve(test);
                }
                else return resolve('no change');
            }
        });
        // Handle network errors
        xhr.onerror = function () {
            reject(Error("Error"));
        };
        xhr.open("GET", "https://api.trello.com/1/cards/" + cardid + "?key=" + trellokey + "&token=" + trellotoken);
        xhr.send(data);
    });

}

//Opt Calls
function GetOptimizelyResults(exid, token, callback) {
    var resultlink = 'https://api.optimizely.com/v2/experiments/' + exid + '/results';
    var x = new XMLHttpRequest();
    x.open('GET', resultlink);
    x.setRequestHeader("Authorization", "Bearer " + token);

    x.onload = function () {
        json = JSON.parse(x.responseText);
        return callback(json);
    };
    x.send();
}

function GetPreviewLinks(exid, token, callback) {
    var resultlink = 'https://api.optimizely.com/v2/experiments/' + exid;
    var x = new XMLHttpRequest();
    x.open('GET', resultlink);
    x.setRequestHeader("Authorization", "Bearer " + token);

    x.onload = function () {
        json = JSON.parse(x.responseText);
        //console.log(json.variations);
        //console.log('here');
        let links = [];
        let projid = json.project_id;
        let campid = json.campaign_id;
        let vars = json.variations;
        vars.forEach(function (v) {
            let l = {};
            //l.link = json.url_targeting.edit_url + "?optimizely_token=" + token + "&optimizely_x=" + v.variation_id + "&optimizely_preview_layer_ids=" + campid + "&optimizely_snippet=" + projid +  "&optimizely_preview_mode_CAMPAIGN=" + campid;
            l.link = v.actions[0].share_link + "&optimizely_preview_mode_CAMPAIGN=" + campid;
            l.name = v.name;
            links.push(l);
        });

        return callback(links);
    };
    x.send();

}