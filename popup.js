// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let apikey, opt1, opt2, opt3, opt4, opt5, opt6;
function getUrlVars(url)
{
    var vars = [], hash;
    var hashes = url.slice(url.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getSavedBase(basenum, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(basenum, (items) => {
    callback(chrome.runtime.lastError ? null : items);
  });
}

function saveStore(key, v) {
  chrome.storage.sync.set({[key]: v});  
}
function saveBase(basenum, baseurl) {
  chrome.storage.sync.set({[basenum]: baseurl});
  //console.log(getUrlVars(baseurl)['api_key']);
  chrome.storage.sync.set({"apikey": getUrlVars(baseurl)['api_key']});
}
function getTokenFromExName(ex) {
  var pre = ex.substring(0,3);
  //console.log(ex);
  //console.log(pre);

  if (opt1 && opt1.startsWith(pre)) return opt1.substr(opt1.indexOf('|') + 1, opt1.length);
  if (opt2 && opt2.startsWith(pre)) return opt2.substr(opt2.indexOf('|') + 1, opt2.length);
  if (opt3 && opt3.startsWith(pre)) return opt3.substr(opt3.indexOf('|') + 1, opt3.length);
  if (opt4 && opt4.startsWith(pre)) return opt4.substr(opt4.indexOf('|') + 1, opt4.length);
  if (opt5 && opt5.startsWith(pre)) return opt5.substr(opt5.indexOf('|') + 1, opt5.length);
  if (opt6 && opt6.startsWith(pre)) return opt6.substr(opt6.indexOf('|') + 1, opt6.length);

  return null;
}

function getBaseJson() {
  var outhtml = "";
  var records = []; 
  //var bn = "1";
  $("myids").empty();

  for (var bn = 6; bn > 0; bn--) {
    let baseget = "base" + bn;
  chrome.storage.sync.get([baseget], function (result) {
        
        if(result[baseget]){
        var output = '';
        //var link = "https://api.airtable.com/v0/app7sijAn7bwELvYg/Roadmap?api_key=keyCCt9CA9X31EYbH";
        var x = new XMLHttpRequest();
        var baseid =result[baseget].substring(result[baseget].lastIndexOf("v0/")+3,result[baseget].lastIndexOf("/"));
        x.open('GET', result[baseget]);
        x.onload = function() {
           json = JSON.parse(x.responseText);
           //console.log(json);

           for (var i = json.records.length - 1; i >= 0; i--) {
            json.records[i].baseid = baseid;
            records.push(json.records[i]);            
           }
           //document.getElementById("myids").innerHTML = output;            
        };
        x.send();
      }
      });
      }
  
      setTimeout(function(){
          //console.log(records);
          var o = _.orderBy(records, ['fields.Status', 'fields.Experiment'], ['asc','asc']);
           //console.log('pop');
           //console.log(o); 
           for (var i = o.length - 1; i >= 0; i--) {
            if(o[i].fields.Status ){ 
              //console.log(o[i].fields);
              if(o[i].fields.Status === "Live" ||
                o[i].fields.Status === "In QA" ||
                o[i].fields.Status === "Spec" ||
                o[i].fields.Status === "Implementation" ||
                o[i].fields.Status === "On Deck" ||
                o[i].fields.Status === "Pending Approval"                
                )              
              {
                outhtml += "<div class='row " +o[i].fields.Status.toLowerCase()+"'>";
                outhtml += "<div class='icos'>";
                if (o[i].fields.Results){
                 outhtml += "<div class='cell'><a href='" + o[i].fields.Results + "' target='_new' title='open results tab' ><img style='width:20px' src='opt.ico' /></a></div>";
                }
                 if (o[i].fields["Trello Link"]){
                 outhtml += "<div class='cell'><a target='_new' href='" + o[i].fields["Trello Link"] +"' title='open trello' ><img style='width:20px' src='trello.ico' /></a></div>";
                }
                outhtml += "</div><div class='status cell "+o[i].fields.Status.toLowerCase()+"'>";                
                outhtml += "<select data-baseid='" + o[i].baseid + "' class='statsel' id='" + o[i].id +"'><option " + ((o[i].fields.Status === 'On Deck') ? "selected":"") + ">On Deck</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'Spec') ? "selected":"") + ">Spec</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'Implementation') ? "selected":"") + ">Implementation</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'In QA') ? "selected":"") + ">In QA</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'Live') ? "selected":"") + ">Live</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'Pending Approval') ? "selected":"") + ">Pending Approval</option>";
                outhtml += "<option>Blocked</option>";                
                outhtml += "<option>Completed</option>";
                outhtml += "<option>Softcoded</option></select>";
                outhtml += "</div>"
                if(o[i].fields.ExperimentId && getTokenFromExName(o[i].fields.Experiment))
                outhtml += "<div class='cell'><a data-token='"+getTokenFromExName(o[i].fields.Experiment)+"' data-exid='"+o[i].fields.ExperimentId+"' title='get results' class='btnGetResults' >" + o[i].fields.Experiment.substring(0,63) + "</a></div>";
                  else
                outhtml += "<div class='cell'>" + o[i].fields.Experiment.substring(0,63) + "</div>";                
                outhtml += "</div>";
                outhtml += "<div class='resultrow row"+o[i].fields.ExperimentId+"'><div id='txt"+o[i].fields.ExperimentId+"'></div></div>";
            }
           }}
           document.getElementById("myids").innerHTML = outhtml; 
           
           //Update status back to airtable
           $(document).on("change", ".statsel", function(event) {
              var base = $(this).data('baseid');
              var recid = $(this).attr('id');
              var newstatus = $(this).find("option:selected").text(); 
              var row =$(this).parent().parent();
              var cell =$(this).parent();
                                         
              var x = new XMLHttpRequest();
              x.open('PATCH','https://api.airtable.com/v0/' + base + '/Roadmap/' + recid + '?api_key=' + apikey);
              x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
              x.onload = function() {  
                 //console.log(x);        
                 json = JSON.parse(x.responseText);
                 if(json.error)
                   alert(json.error.type); 
                 else {
                    //console.log(row);
                    row.removeClass().addClass(newstatus.toLowerCase()).addClass('row');
                    cell.removeClass().addClass(newstatus.toLowerCase()).addClass('cell').addClass('status');
                    if (newstatus==="Live"){
                      $('.LiveUpdate').slideToggle();
                      //console.log(base);
                      $('.btnLiveUpdate').attr('data-base', base);
                      $('.btnLiveUpdate').attr('data-recid', recid);                      
                    }
                 }
              };
              x.send(JSON.stringify({fields: { Status: newstatus } }));              
            });

          //Pull results from Optimizely
          $(document).on("click", ".btnGetResults", function(event) {
            var token = $(this).data('token');
            var exid = $(this).data('exid');
            var resultlink = 'https://api.optimizely.com/v2/experiments/' + exid + '/results';
            $('.row' + exid).slideToggle();
            
            if(!$('.row' + exid).is(':visible'))
              return;
            var x = new XMLHttpRequest();
              x.open('GET',resultlink);
              x.setRequestHeader("Authorization", "Bearer " + token);
              
              x.onload = function() {                   
                 json = JSON.parse(x.responseText); 
                 //console.log(json);              
                 var rtext = "";
                 var start = "Started on: " + json.start_time + "<br>";
                 var total_visitors = "Total visitors:" + json.reach.total_count + "<br>";
                 rtext += start + total_visitors + "<ul>";
                 for (var c = 0; c < json.metrics.length; c++) {
                   
                    //metric name
                    rtext += "<li>" + json.metrics[c].name + "<br><ul>";
                    let o = 0;
                    for (var prop in json.metrics[c].results) {                        
                        if (json.metrics[c].results[prop].is_baseline === false) {
                          var lift = Math.round((json.metrics[c].results[prop].lift.value * 100)*10)/10 + "%";
                          var ss = Math.floor(json.metrics[c].results[prop].lift.significance * 100) + "%";
                          //variation results
                          rtext += "<li>" + "V" + o + ": " + lift + " @" + ss + "</li>";
                        }
                        o++;
                    }
                    rtext += "</li></ul>";
                 }
                 rtext += "</ul>";
                 //console.log(rtext);
                 $('#txt' + exid).html(rtext);
                 
              };
            x.send(); 
          });

        }
        ,2100);
  
}

function UpdateAtRecord(recordname, value, baseid, recid) {
         
      var x = new XMLHttpRequest();
      x.open('PATCH','https://api.airtable.com/v0/' + baseid + '/Roadmap/' + recid + '?api_key='+ apikey);
      x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      x.onload = function() {  
         //console.log(x);        
         json = JSON.parse(x.responseText);
         if(json.error)
           alert(json.error.type);          
      };
      x.send(JSON.stringify({fields: { [recordname]: value } }));
}

//let opt1;
function setOptTokens() {
  for (let xn = 1; xn < 7; xn++) {
    let xget = "opt" + xn;
    getSavedBase([xget], (tok) => {
      if (tok[xget]){
        if (tok[xget].length > 1) {          
         if (xn===1)         
          opt1 = tok[xget];        
         else if (xn===2)
           opt2 = tok[xget];
         else if (xn===3)
           opt3 = tok[xget];
         else if (xn===4)
           opt4 = tok[xget];
         else if (xn===5)
           opt5 = tok[xget];
         else if (xn===6)
          opt6 = tok[xget];                 
      
      }}
     })
    }
}

document.addEventListener('DOMContentLoaded', () => {   
   
   chrome.storage.sync.get("apikey", (ap) => {
        apikey = ap['apikey'];
   });
  
  setOptTokens();

   for (var xn = 1; xn < 7; xn++) {
    let xget = "base" + xn;
    let xopt = "opt" + xn;
    let txtPre = "txtPrefix" + xn;
    let txtTok = "txtOptToken" + xn;
      getSavedBase([xget], (saveurl) => {
        if (saveurl[xget] && saveurl[xget].length > 0) {
           document.getElementById(xget).value = saveurl[xget];         
        } 
       })
      getSavedBase([xopt], (v) => {
        if (v[xopt]  && v[xopt].length > 0) {
            $('#' + txtPre).val(v[xopt].substr(0, v[xopt].indexOf('|')));
            $('#' + txtTok).val(v[xopt].substr(v[xopt].indexOf('|') + 1, v[xopt].length));              
        } 
       })
    }
    
    setTimeout(function () {
      if ($('#base1').val().length === 0) {
        $("myids").empty();
        document.getElementById("myids").innerHTML = "First enter your bases: <a href='https://crometrics.quip.com/nezDAyAVPf7b/Setup-Airtable-Quickview-Chrome-Extension' target='_new'>Instructions</a>";
      } else {
        getBaseJson();
      }
     }, 1000);
    

    $('.togbase').click(function(e){
        e.preventDefault();
        $('.baseurls').slideToggle();
    });

    $('.toglive').click(function(e){
        e.preventDefault();
        //$('.live').toggle();

        //$(this).text('show live tests');
        var txt = $(".live").is(':visible') ? 'show live tests' : 'hide live tests';
        $(".toglive").text(txt);
        $(".live").slideToggle();
    });
    
    $('.togsettings').click(function(e){
        e.preventDefault();        
        $(".settings").slideToggle();
    });

    document.getElementById("btnSaveBases").addEventListener("click", function(){
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

    document.getElementById("btnSaveOptTokens").addEventListener("click", function(){
      saveStore("opt1", $("#txtPrefix1").val() + "|" + $('#txtOptToken1').val());
      saveStore("opt2", $("#txtPrefix2").val() + "|" + $('#txtOptToken2').val());
      saveStore("opt3", $("#txtPrefix3").val() + "|" + $('#txtOptToken3').val());
      saveStore("opt4", $("#txtPrefix4").val() + "|" + $('#txtOptToken4').val());
      saveStore("opt5", $("#txtPrefix5").val() + "|" + $('#txtOptToken5').val());
      saveStore("opt6", $("#txtPrefix6").val() + "|" + $('#txtOptToken6').val());
      setOptTokens();
      getBaseJson();
      $('.settings').slideToggle();
    });

    //bind close button for update slide up    
    $(".btnClose").click("click", function(){
      $('.LiveUpdate').slideToggle();
    });
    $(".btnCloseBases").click("click", function(){
      $('.baseurls').slideToggle();
    });
    $(".btnCloseTokens").click("click", function(){
      $('.settings').slideToggle();
    });

    //bind update button for update slide up    
    $(".btnLiveUpdate").click("click", function(){
      if ($('#txtexid').val().length>0) {
        UpdateAtRecord('ExperimentId', $('#txtexid').val(), $(this).data('base'), $(this).data('recid'));
      }
      if ($('#txtresultlink').val().length>0) {
        UpdateAtRecord('Results', $('#txtresultlink').val(), $(this).data('base'), $(this).data('recid'));
      }
      $('.LiveUpdate').slideToggle();
    });
    
});