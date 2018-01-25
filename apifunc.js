
let trellomembers;

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

    Promise.all(requestsArray.map((request) => {
        return fetch(request).then((response) => {
            return response.json();
        }).then((data) => {
            //console.log(request);
            data.baseid = request.url.substring(request.url.lastIndexOf("v0/") + 3, request.url.lastIndexOf("/"))
            return data;
        });
    })).then((values) => {
        values.map((item) => {
            for (var i = item.records.length - 1; i >= 0; i--) {
                item.records[i].baseid = item.baseid;
                records.push(item.records[i]);
            }
            alltests = records;
            console.log('values', alltests);
            bindTests(alltests);
        });

    }).catch(console.error.bind(console));


}

function GetImplementationLists(callback) {
    var data = JSON.stringify(false);
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.addEventListener("readystatechange", function () {
        //this fires after trello board is read
        if (this.readyState === this.DONE) {
            let lists = JSON.parse(this.responseText);
            let listurl = 'https://api.trello.com/1/lists/{listid}/cards?key=6a01041a56e1d1f610a333b570af7ece&token=90235165a1c65b68409f8fe673d6cc9cef677e82d07697871674bcb7d012c512';
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
                    //console.log(request);
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

    xhr.open("GET", "https://api.trello.com/1/boards/chLoHyqs/lists?key=6a01041a56e1d1f610a333b570af7ece&token=90235165a1c65b68409f8fe673d6cc9cef677e82d07697871674bcb7d012c512");
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

    xhr.open("POST", "https://api.trello.com/1/cards/" + cardid + "/idMembers?value=" + memberId + "&key=6a01041a56e1d1f610a333b570af7ece&token=90235165a1c65b68409f8fe673d6cc9cef677e82d07697871674bcb7d012c512");
    xhr.send(data);
}

function MoveCard(cardid, listid, memberToAdd, username, callback) {
    //console.log(cardid + "|" + listid + "|" + boardid);
    var date = new Date();
    date.setDate(date.getDate() + 3);
    if (date.getDay() === 0) {
        date.setDate(date.getDate() + 1);
    } else if (date.getDay() === 6) {
        date.setDate(date.getDate() + 2);
    }
    var duedate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    var data = JSON.stringify(false);

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            //console.log(this);
            AddMemberToCard(cardid, memberToAdd);
            AddTrelloComment(username, cardid);
        }
    });

    xhr.open("PUT", "https://api.trello.com/1/cards/" + cardid + "?idList=" + listid + "&idBoard=54f4ad49bb26fe25381f2048&due=" + duedate + "&key=6a01041a56e1d1f610a333b570af7ece&token=90235165a1c65b68409f8fe673d6cc9cef677e82d07697871674bcb7d012c512");
    xhr.send(data);

}

function UpdateAtRecord(recordname, value, baseid, recid) {

    var x = new XMLHttpRequest();
    x.open('PATCH', 'https://api.airtable.com/v0/' + baseid + '/Roadmap/' + recid + '?api_key=' + apikey);
    x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    x.onload = function () {
        console.log(x);
        json = JSON.parse(x.responseText);
        if (json.error)
            alert(json.error.type);
    };
    x.send(JSON.stringify({ fields: { [recordname]: value } }));
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

    xhr.open("GET", "https://api.trello.com/1/organizations/51ae3b0fe6c311dd13000de0/members?filter=all&fields=all&key=6a01041a56e1d1f610a333b570af7ece&token=90235165a1c65b68409f8fe673d6cc9cef677e82d07697871674bcb7d012c512");
    xhr.send(data);
}

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

function AddTrelloComment(username, cardid) {
    var data = null;
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            console.log(this.responseText);
        }
    });
    comment = encodeURIComponent("@" + username + " here's another one for the queue. Let me know if any questions. Thanks!");

    xhr.open("POST", "https://api.trello.com/1/cards/" + cardid + "/actions/comments?text=" + comment + "&key=6a01041a56e1d1f610a333b570af7ece&token=90235165a1c65b68409f8fe673d6cc9cef677e82d07697871674bcb7d012c512");
    xhr.send(data);
}