
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

function AddMemberToCard(memberId){
    var data = JSON.stringify(false);
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function () {
    if (this.readyState === this.DONE) {
        console.log(this.responseText);
    }
    });

    xhr.open("POST", "https://api.trello.com/1/cards/cn1qNlow/idMembers?value=572a2b5be53c35896b88e26a&key=6a01041a56e1d1f610a333b570af7ece&token=90235165a1c65b68409f8fe673d6cc9cef677e82d07697871674bcb7d012c512");
    xhr.send(data);
}

function MoveCard(cardid, listid, boardid, memberToAdd, callback) {
    console.log(cardid + "|" + listid + "|" + boardid);
    var data = JSON.stringify(false);

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            AddMemberToCard(memberToAdd);
        }
    });

    xhr.open("PUT", "https://api.trello.com/1/cards/" + cardid + "?idList=" + listid + "&idBoard=" + boardid + "&key=6a01041a56e1d1f610a333b570af7ece&token=90235165a1c65b68409f8fe673d6cc9cef677e82d07697871674bcb7d012c512" );
    xhr.send(data);

}