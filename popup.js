let apikey, opt1, opt2, opt3, opt4, opt5, opt6;
let filteredtests, alltests;
let urlArray = [];
let atArray = [];
let tbArray = [];

function strip(html)
{
   var re = /<br>/gi;
   html = html.replace(re,"\r\n"); 
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

function getUrlVars(url) {
  var vars = [], hash;
  var hashes = url.slice(url.indexOf('?') + 1).split('&');
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

/// Setting Functions
function getSavedBase(basenum, callback) {
  chrome.storage.sync.get(basenum, (items) => {
    callback(chrome.runtime.lastError ? null : items);
  });
}

function saveStore(key, v) {
  chrome.storage.sync.set({ [key]: v });
}

function saveBase(basenum, baseurl) {
  chrome.storage.sync.set({ [basenum]: baseurl });
  urlArray.push(baseurl);
  chrome.storage.sync.set({ "apikey": getUrlVars(baseurl)['api_key'] });
}
function getTokenFromExName(ex) {
  var pre = ex.substring(0, 3);

  if (opt1 && opt1.startsWith(pre)) return opt1.substr(opt1.indexOf('|') + 1, opt1.length);
  if (opt2 && opt2.startsWith(pre)) return opt2.substr(opt2.indexOf('|') + 1, opt2.length);
  if (opt3 && opt3.startsWith(pre)) return opt3.substr(opt3.indexOf('|') + 1, opt3.length);
  if (opt4 && opt4.startsWith(pre)) return opt4.substr(opt4.indexOf('|') + 1, opt4.length);
  if (opt5 && opt5.startsWith(pre)) return opt5.substr(opt5.indexOf('|') + 1, opt5.length);
  if (opt6 && opt6.startsWith(pre)) return opt6.substr(opt6.indexOf('|') + 1, opt6.length);

  return null;
}
/// End Setting Functions

function GetAirtableUrl(clientcode, recid) {
    if(atArray[clientcode]){
      return "https://airtable.com/" + atArray[clientcode] + "/" + recid;
    } else return null;
}

/// Bind Test To DOM
function bindTests(testtobind) {

var d = new Date();
localStorage.setItem('alltest', JSON.stringify(testtobind));
localStorage.setItem('lastopen', d);

  console.log(testtobind);
  $("body").off("change", ".statsel");
  $("body").off("click", ".btnGetResults");
  $("body").off("click", ".btnCloseToR");
  $("body").off("click", ".addTrello");
  $("body").off("click", ".addResults");
  $("body").off("click", ".btnLaunch");
  $("#myids").empty();
  var outhtml = "";

  var o = _.orderBy(testtobind, ['fields.Status', 'fields.Experiment'], ['asc', 'asc']);

  for (var i = o.length - 1; i >= 0; i--) {

    if (o[i].fields.Status) {

      
      if ((o[i].fields.Status === "Live" ||
        o[i].fields.Status === "In QA" ||
        o[i].fields.Status === "Spec" ||
        o[i].fields.Status === "Implementation" ||
        o[i].fields.Status === "On Deck" ||
        o[i].fields.Status === "Pending Approval" ||
        o[i].fields.Status === "Ready for PM") &&  o[i].fields.Experiment
      ) {
        outhtml += "<div class='row " + o[i].fields.Status.toLowerCase() + "' data-clientcode='" + o[i].fields.Experiment.substring(0, 3) + "'>";
        outhtml += "<div class='icos'>";
        if (o[i].fields.Results) {
          outhtml += "<div class='cell'><a href='" + o[i].fields.Results + "' target='_new' title='open results tab' ><img style='width:20px' src='opt.ico' /></a></div>";
        } else {
          outhtml += "<div class='cell'><a data-baseid='" + o[i].baseid + "' data-recid='" + o[i].id + "' class='addResults' title='add results link' ><img style='width:20px' src='opt.png' /></a></div>";
        }

        if (o[i].fields["Trello Link"]) {
          outhtml += "<div class='cell'><a target='_new' href='" + o[i].fields["Trello Link"] + "' title='open trello' ><img style='width:20px' src='trello.ico' /></a></div>";
        } else {
          outhtml += "<div class='cell'><a data-baseid='" + o[i].baseid + "' data-recid='" + o[i].id + "' class='addTrello' title='add trello link' ><img style='width:20px' src='trello.png' /></a></div>";
        }

        if (GetAirtableUrl(o[i].fields.Experiment.substring(0, 3),  o[i].id)) {
          outhtml += "<div class='cell'><a target='_new' href='" + GetAirtableUrl(o[i].fields.Experiment.substring(0, 3),  o[i].id) + "' title='open airtable record' ><img style='width:20px' src='airtable.png' /></a></div>";
        } else {
          outhtml += "<div class='cell'><img style='width:20px' src='airtable-off.png' /></div>";
        }

        outhtml += "</div><div class='status cell " + o[i].fields.Status.toLowerCase() + "'>";
        outhtml += "<select data-trelloid='" + o[i].trelloid + "' data-baseid='" + o[i].baseid + "' class='statsel' id='" + o[i].id + "'><option " + ((o[i].fields.Status === 'On Deck') ? "selected" : "") + ">On Deck</option>";
        outhtml += "<option " + ((o[i].fields.Status === 'Spec') ? "selected" : "") + ">Spec</option>";
        outhtml += "<option " + ((o[i].fields.Status === 'Implementation') ? "selected" : "") + ">Implementation</option>";
        outhtml += "<option " + ((o[i].fields.Status === 'In QA') ? "selected" : "") + ">In QA</option>";
        outhtml += "<option " + ((o[i].fields.Status === 'Live') ? "selected" : "") + ">Live</option>";
        outhtml += "<option " + ((o[i].fields.Status === 'Pending Approval') ? "selected" : "") + ">Pending Approval</option>";
        outhtml += "<option " + ((o[i].fields.Status === 'Ready for PM') ? "selected" : "") + ">Ready for PM</option>";
        outhtml += "<option>Blocked</option>";
        outhtml += "<option>Completed</option>";
        outhtml += "<option>Softcoded</option></select>";
        outhtml += "</div>"
        if (o[i].fields.ExperimentId && getTokenFromExName(o[i].fields.Experiment) && o[i].fields.Status === "Live")
          outhtml += "<div class='cell'><a data-token='" + getTokenFromExName(o[i].fields.Experiment) + "' data-exid='" + o[i].fields.ExperimentId + "' title='get results' class='btnGetResults' >" + o[i].fields.Experiment.substring(0, 58) + "</a></div>";
        
        else
          outhtml += "<div class='cell'>" + o[i].fields.Experiment.substring(0, 58) + "</div>";

        if ((o[i].fields.Status === 'Ready for PM' || o[i].fields.Status === 'Pending Approval') && o[i].fields.ExperimentId && getTokenFromExName(o[i].fields.Experiment)) {
          if (parseInt(o[i].fields.ExperimentId, 10) > 0) {
            outhtml += "<div class='emailicon'><a data-token='" + getTokenFromExName(o[i].fields.Experiment) + "' data-exid='" + o[i].fields.ExperimentId + "' data-name='" + o[i].fields.Experiment.replace(/'/g, "`") + "' class='btnLaunch' href='#'><img src='email.png' title='get approval to launch template'></a></div>";
          }

        }
        outhtml += "</div>";
        outhtml += "<div class='resultrow row" + o[i].fields.ExperimentId + "'><div id='txt" + o[i].fields.ExperimentId + "'></div></div>";
      }
    }
  }

  $("#myids").html(outhtml);

  //Update status back to airtable
  $("body").on("change", ".statsel", function (event) {
    //console.log('change');
    var base = $(this).data('baseid');
    var recid = $(this).attr('id');
    var newstatus = $(this).find("option:selected").text();
    var row = $(this).parent().parent();
    var cell = $(this).parent();
    var trellocardid = $(this).data('trelloid');
    var clientcode = row.data('clientcode');
    var exid = $(this).parent().next().find('.btnGetResults').data('exid');
    var token = $(this).parent().next().find('.btnGetResults').data('token');

    UpdateAtRecord('Status', newstatus, base, recid, function () {
      row.removeClass().addClass(newstatus.toLowerCase()).addClass('row');
      cell.removeClass().addClass(newstatus.toLowerCase()).addClass('cell').addClass('status');

      if (newstatus === "Live") {
        
        var d = new Date();
        var n = d.toISOString();
        UpdateAtRecord('Start Date', n, base, recid);

        $('.LiveUpdate').slideToggle();
        //console.log(base);
        $('.btnLiveUpdate').attr('data-base', base);
        $('.btnLiveUpdate').attr('data-recid', recid);

        GetAtRecord(base, recid, function (rec) {
          $('#txtexid').val(rec.fields.ExperimentId);
          $('#txtresultlink').val(rec.fields.Results);
        });

        if(tbArray[clientcode]){
          ScanBoardForListId(tbArray[clientcode], 'Launch', function(listid, boardid) {

            MoveCard(trellocardid, listid, null, null, "Test launched", null, boardid);

          });
        }

      } else if (newstatus === 'Implementation') {

        $('.SendToDev').slideToggle();
        let developers;
        $('.btnDev').attr('data-trellocardid', trellocardid);
        GetImplementationLists(function (data) {

          data = _.slice(data, 4);
          data = _.sortBy(data, [function (o) { return o.data; }]);
          //console.log(trellomembers);
          let devhtml = data.map((dev) => {
            let m = _.find(trellomembers, function (o) { return dev.name.startsWith(o.fullName); });
            if (m)
              return '<option value="' + dev.id + '|' + m.id + '|' + m.username + '">[' + dev.data + ' cards] ' + dev.name + '</option>';
          });
          $('#selDev').html(devhtml);

          $("body").on("click", ".btnDev", function (event) {
            let listid = $('#selDev').val().split('|')[0];
            let memberid = $('#selDev').val().split('|')[1];
            let username = $('#selDev').val().split('|')[2];
            let comment = $('#txtComment').val();
            let due = $('#txtDueDate').val();
            //console.log("listid" + listid);
            //console.log("memeberid" + memberid);
            MoveCard($('.btnDev').data('trellocardid'), listid, memberid, username, comment, due, null);
            $('.SendToDev').slideToggle();
            $("body").off("click", ".btnDev");
          });
          $("body").on("click", ".btnCloseDev", function (event) {
            $('.SendToDev').slideToggle();
            $("body").off("click", ".btnCloseDev");
          });
        });
      } else if (newstatus === 'Pending Approval' || newstatus === 'In QA' || newstatus === 'Ready for PM') {

        //Pull experiment id from trello card and save in airtable, then refresh tests
        GetExperimentId(trellocardid, function (expid) {
          if (parseInt(expid, 10) > 0) {
            UpdateAtRecord('ExperimentId', expid, base, recid, function () {
              getBaseJson();
              return;
            });
          }
        });

        if (newstatus === 'Pending Approval') {
          // move card to signoff list on client board
          if(tbArray[clientcode]){
            ScanBoardForListId(tbArray[clientcode], 'Signoff', function(listid, boardid) {

              MoveCard(trellocardid, listid, null, null, "Request for approval sent", null, boardid);

            });
          }
        }

      } else if (newstatus === 'Completed' || newstatus === 'Blocked') {
        
        var d = new Date();
        var n = d.toISOString();
        UpdateAtRecord('End Date', n, base, recid);

        if(tbArray[clientcode]){
          ScanBoardForListId(tbArray[clientcode], 'Done', function(listid, boardid) {

            if (newstatus === 'Completed') {
              GetAtRecord(base, recid,  function (rec) {
                MoveCard(trellocardid, listid, null, null, "Test completed on " + n + " results: " + rec.fields.Results, null, boardid);
              });              
              
              GetOptimizelyResults(exid, token, function (rtext) {   
                UpdateAtRecord("Final Results", strip(rtext), base, recid);
              });
            }
            else 
             MoveCard(trellocardid, listid, null, null, "Test blocked on " + n, null, boardid);

          });
        }

        getBaseJson();
        
        return;
      } else if (newstatus === 'Softcoded') {
        if(tbArray[clientcode]){
          
          var d = new Date();
          var n = d.toISOString();
          UpdateAtRecord('End Date', n, base, recid);

          GetOptimizelyResults(exid, token, function (rtext) {   
            UpdateAtRecord("Final Results", strip(rtext), base, recid);
          });
          
          ScanBoardForListId(tbArray[clientcode], 'Hard', function(listid, boardid) {
            MoveCard(trellocardid, listid, null, null, "Test set to 100%", null, boardid);
          });
        }
      }
      getBaseJson();
    });
  });

  //Pull results from Optimizely
  $("body").on("click", ".btnGetResults", function (event) {
    var token = $(this).data('token');
    var exid = $(this).data('exid');
    $('.row' + exid).slideToggle();

    if (!$('.row' + exid).is(':visible'))
      return;

    GetOptimizelyResults(exid, token, function (rtext) {      
      //console.log(rtext);
      $('#txt' + exid).html(rtext);
    });

  });

  //Get launch email template 
  $("body").on("click", ".btnLaunch", function (event) {
    var token = $(this).data('token');
    var exid = $(this).data('exid');
    var exname = $(this).data('name');
    var rtext = "";
    $('.row' + exid).slideToggle();

    if (!$('.row' + exid).is(':visible'))
      return;

     let launchtemp = "<p>[Approval to Launch]" + exname + "</p><p>Hi xxxx,</p><p>This test is now ready to launch.</p><p>If there is no feedback, just reply 'approved' and we will get this test launched.</p><p>Live Preview: (We recommend copy & pasting the links into an incognito )</p><p>{links}</p><p>Thanks,<br></p>";
    let linkblock = "";
    GetPreviewLinks(exid, token, function (x) {
      //console.log(x);
      x.forEach(function (link) {
        linkblock += "<a href='" + link.link + "' >" + link.name + "</a><br>";
      });
      rtext = launchtemp.replace('{links}', linkblock);
      $('#txt' + exid).html(rtext);
    });

  });

  $("body").on("click", ".addTrello", function (event) {
    //pop modal            
    var base = $(this).data('baseid');
    var recid = $(this).data('recid');
    $('.UpdateToR').slideToggle();
    $("body").on("click", ".btnToR", function (event) {
      UpdateAtRecord('Trello Link', $('#txtField').val(), base, recid);
      $('#txtField').val('');
      $('.UpdateToR').slideToggle();
      $("body").off("click", ".btnToR");
      getBaseJson();
    });
    $("body").on("click", ".btnCloseToR", function (event) {
      $('.UpdateToR').slideToggle();
      $("body").off("click", ".btnCloseToR");
    });

  });

  $("body").on("click", ".addResults", function (event) {
    //pop modal
    var base = $(this).data('baseid');
    var recid = $(this).data('recid');
    $('.UpdateToR').slideToggle();
    $("body").on("click", ".btnToR", function (event) {
      UpdateAtRecord('Results', $('#txtField').val(), base, recid);
      $('#txtField').val('');
      $('.UpdateToR').slideToggle();
      $("body").off("click", ".btnToR");
      getBaseJson();
    });
    $("body").on("click", ".btnCloseToR", function (event) {
      $('.UpdateToR').slideToggle();
      $("body").off("click", ".btnCloseToR");
    });

  });

}

function filterTests(query) {
  if (query.length < 1) { bindTests(alltests); }
  
  filteredtests = _.filter(alltests, function (item) {
    return item.fields.Experiment.toLowerCase().indexOf(query.toLowerCase()) > -1;
  });
  bindTests(filteredtests);
}

function setOptTokens() {
  for (let xn = 1; xn < 7; xn++) {
    let xget = "opt" + xn;
    getSavedBase([xget], (tok) => {
      if (tok[xget]) {
        if (tok[xget].length > 1) {
          if (xn === 1)
            opt1 = tok[xget];
          else if (xn === 2)
            opt2 = tok[xget];
          else if (xn === 3)
            opt3 = tok[xget];
          else if (xn === 4)
            opt4 = tok[xget];
          else if (xn === 5)
            opt5 = tok[xget];
          else if (xn === 6)
            opt6 = tok[xget];

        }
      }
    })
  }

  for (let xn = 1; xn < 7; xn++) {
    let xget = "at" + xn;
    getSavedBase([xget], (tok) => {
      if (tok[xget]) {
        if (tok[xget].length > 4) {
           let sa = tok[xget].split('|');
           atArray[sa[0]] = sa[1];    
        }
      }
    })
  }
  
  for (let xn = 1; xn < 7; xn++) {
    let xget = "tb" + xn;
    getSavedBase([xget], (tok) => {
      if (tok[xget]) {
        if (tok[xget].length > 4) {
           let sa = tok[xget].split('|');
           tbArray[sa[0]] = sa[1];    
        }
      }
    })
  }

  getSavedBase('trellokey', (tok) => {
    trellokey = tok.trellokey;
  });
  getSavedBase('trellotoken', (tok) => {
    trellotoken = tok.trellotoken;
    setTimeout(() => {
      GetTrelloMembers();
    }, 500);
  });
}

function populateSettings() {
  for (var xn = 1; xn < 7; xn++) {
    let xget = "base" + xn;
    let xopt = "opt" + xn;
    let xtb = "tb" + xn;
    let atb = "at" + xn;
    let txtPre = "txtPrefix" + xn;
    let txtTok = "txtOptToken" + xn;
    let txtTB = "txtTrelloBoard" + xn;
    let txtAT = "txtAirtableId" + xn;

    getSavedBase([xget], (saveurl) => {
      if (saveurl[xget] && saveurl[xget].length > 0) {
        document.getElementById(xget).value = saveurl[xget];
        urlArray.push(saveurl[xget]);
      }
    })
    getSavedBase([xopt], (v) => {
      if (v[xopt] && v[xopt].length > 0) {
        $('#' + txtPre).val(v[xopt].substr(0, v[xopt].indexOf('|')));
        $('#' + txtTok).val(v[xopt].substr(v[xopt].indexOf('|') + 1, v[xopt].length));
      }
    });
    getSavedBase([xtb], (v) => {
      if (v[xtb] && v[xtb].length > 0) {
        
        $('#' + txtTB).val(v[xtb].substr(v[xtb].indexOf('|') + 1, v[xtb].length));
      }
    });
    getSavedBase([atb], (v) => {
      if (v[atb] && v[atb].length > 0) {
        
        $('#' + txtAT).val(v[atb].substr(v[atb].indexOf('|') + 1, v[atb].length));
      }
    });

  }
  getSavedBase('trellokey', (v) => {
    //console.log(v);
    $('#txtTrelloKey').val(v.trellokey);
  });
  getSavedBase('trellotoken', (v) => {
    //console.log(v);
    $('#txtTrelloToken').val(v.trellotoken);
  });
  getSavedBase('base1', (v) => {
    console.log(v);  
    if(v){
      var Five_Minutes = 5 * 60 * 1000;
      var currentdatetime = new Date();
      if((currentdatetime - new Date(localStorage.getItem('lastopen'))) < Five_Minutes){
        console.log('less than 5 minutes')
        alltests = JSON.parse(localStorage.getItem('alltest'));
        bindTests(alltests);
      } else getBaseJson();
    }  else {
      $("myids").empty();
      document.getElementById("myids").innerHTML = "First enter your bases: <a href='https://crometrics.quip.com/nezDAyAVPf7b/Setup-Airtable-Quickview-Chrome-Extension' target='_new'>Instructions</a>";
    }
  });

}

document.addEventListener('DOMContentLoaded', () => {

  chrome.storage.sync.get("apikey", (ap) => {
    apikey = ap['apikey'];
  });

  setOptTokens();
  populateSettings();


  $('.togbase').click(function (e) {
    e.preventDefault();
    $('.baseurls').slideToggle();
  });

  $('.toglive').click(function (e) {
    e.preventDefault();
    //$('.live').toggle();

    //$(this).text('show live tests');
    var txt = $(".live").is(':visible') ? 'show live tests' : 'hide live tests';
    $(".toglive").text(txt);
    $(".live").slideToggle();
  });

  $('.togsettings').click(function (e) {
    e.preventDefault();
    $(".settings").slideToggle();
  });

  document.getElementById("btnSaveBases").addEventListener("click", function () {
    saveBase("base1", document.getElementById("base1").value);
    saveBase("base2", document.getElementById("base2").value);
    saveBase("base3", document.getElementById("base3").value);
    saveBase("base4", document.getElementById("base4").value);
    saveBase("base5", document.getElementById("base5").value);
    saveBase("base6", document.getElementById("base6").value);
    getBaseJson();
    $('.baseurls').hide();
    chrome.storage.sync.get("apikey", (ap) => {
      apikey = ap['apikey'];
    });

  });

  document.getElementById("btnSaveOptTokens").addEventListener("click", function () {
    saveStore("opt1", $("#txtPrefix1").val() + "|" + $('#txtOptToken1').val());
    saveStore("opt2", $("#txtPrefix2").val() + "|" + $('#txtOptToken2').val());
    saveStore("opt3", $("#txtPrefix3").val() + "|" + $('#txtOptToken3').val());
    saveStore("opt4", $("#txtPrefix4").val() + "|" + $('#txtOptToken4').val());
    saveStore("opt5", $("#txtPrefix5").val() + "|" + $('#txtOptToken5').val());
    saveStore("opt6", $("#txtPrefix6").val() + "|" + $('#txtOptToken6').val());
    saveStore("trellokey", $("#txtTrelloKey").val());
    saveStore("trellotoken", $("#txtTrelloToken").val());
    saveStore("tb1", $("#txtPrefix1").val() + "|" + $('#txtTrelloBoard1').val());
    saveStore("tb2", $("#txtPrefix2").val() + "|" + $('#txtTrelloBoard2').val());
    saveStore("tb3", $("#txtPrefix3").val() + "|" + $('#txtTrelloBoard3').val());
    saveStore("tb4", $("#txtPrefix4").val() + "|" + $('#txtTrelloBoard4').val());
    saveStore("tb5", $("#txtPrefix5").val() + "|" + $('#txtTrelloBoard5').val());
    saveStore("tb6", $("#txtPrefix6").val() + "|" + $('#txtTrelloBoard6').val());
    saveStore("at1", $("#txtPrefix1").val() + "|" + $('#txtAirtableId1').val());
    saveStore("at2", $("#txtPrefix2").val() + "|" + $('#txtAirtableId2').val());
    saveStore("at3", $("#txtPrefix3").val() + "|" + $('#txtAirtableId3').val());
    saveStore("at4", $("#txtPrefix4").val() + "|" + $('#txtAirtableId4').val());
    saveStore("at5", $("#txtPrefix5").val() + "|" + $('#txtAirtableId5').val());
    saveStore("at6", $("#txtPrefix6").val() + "|" + $('#txtAirtableId6').val());
    setOptTokens();
    getBaseJson();
    $('.settings').slideToggle();
  });

  //bind close button for update slide up    
  $(".btnClose").click("click", function () {
    $('.LiveUpdate').slideToggle();
  });
  $(".btnCloseBases").click("click", function () {
    $('.baseurls').slideToggle();
  });
  $(".btnCloseTokens").click("click", function () {
    $('.settings').slideToggle();
  });

  //refresh
  $(".refresh").click("click", function () {
    getBaseJson();
  });

  //bind update button for update slide up    
  $(".btnLiveUpdate").click("click", function () {
    if ($('#txtexid').val().length > 0) {
      UpdateAtRecord('ExperimentId', $('#txtexid').val(), $(this).data('base'), $(this).data('recid'));
    }
    if ($('#txtresultlink').val().length > 0) {
      UpdateAtRecord('Results', $('#txtresultlink').val(), $(this).data('base'), $(this).data('recid'));
    }
    $('.LiveUpdate').slideToggle();
    $('#txtexid').val('');
    $('#txtresultlink').val('');
  });

  $("#txtsearch").on('input', function () {
    //filterTests($("#txtsearch").val());
    getBaseJson($("#txtsearch").val());
  });

  


});