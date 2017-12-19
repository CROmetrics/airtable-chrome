// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function getSavedBase(basenum, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(basenum, (items) => {
    callback(chrome.runtime.lastError ? null : items);
  });
}

function saveBase(basenum, baseurl) {
  chrome.storage.sync.set({[basenum]: baseurl});
}

function getBaseJson() {
  var outhtml = "";
  var records = []; 
  //var bn = "1";
  $("myids").empty();

  for (var bn = 5; bn > 0; bn--) {
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
          var o = _.sortBy(records, function(r){
              return (r.fields.Status) ? r.fields.Status: "";
           });
           //console.log('pop');
           //console.log(o); 
           for (var i = o.length - 1; i >= 0; i--) {
            if(o[i].fields.Status ){ 
              //console.log(o[i].fields);
              if(o[i].fields.Status === "Live" ||
                o[i].fields.Status === "In QA" ||
                o[i].fields.Status === "Spec" ||
                o[i].fields.Status === "Implementation" ||
                o[i].fields.Status === "On Deck"
                )
              
              {
                outhtml += "<div class='row " +o[i].fields.Status.toLowerCase()+"'><div class='status cell "+o[i].fields.Status.toLowerCase()+"'>";
                outhtml += "<select data-baseid='" + o[i].baseid + "' class='statsel' id='" + o[i].id +"'><option " + ((o[i].fields.Status === 'Live') ? "selected":"") + ">Live</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'In QA') ? "selected":"") + ">In QA</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'Spec') ? "selected":"") + ">Spec</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'Implementation') ? "selected":"") + ">Implementation</option>";
                outhtml += "<option " + ((o[i].fields.Status === 'On Deck') ? "selected":"") + ">On Deck</option>";
                outhtml += "<option>Completed</option>";
                outhtml += "<option>Softcoded</option></select>";
                outhtml += "</div>"
                outhtml += "<div class='cell'>" + o[i].fields.Experiment + "</div></div>";
            }
           }}
           document.getElementById("myids").innerHTML = outhtml; 
           
           $(document).on("change", ".statsel", function(event) {
              var base = $(this).data('baseid');
              var recid = $(this).attr('id');
               var newstatus = $(this).find("option:selected").text(); 

              var x = new XMLHttpRequest();
              x.open('PATCH','https://api.airtable.com/v0/' + base + '/Roadmap/' + recid + '?api_key=keyCCt9CA9X31EYbH');
              x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
              x.onload = function() {  
                 console.log(x);        
                 json = JSON.parse(x.responseText);
                 if(json.error)
                   alert(json.error.type); 
                 else {

                 }
              };
              x.send(JSON.stringify({fields: { Status: newstatus } }));              
            });
        }
        ,2100);
  
}


document.addEventListener('DOMContentLoaded', () => {   
   
   for (var xn = 1; xn < 7; xn++) {
    let xget = "base" + xn;

    getSavedBase([xget], (saveurl) => {
       if (saveurl[xget] !== 'undefined') {
         document.getElementById(xget).value = saveurl[xget];
      } 
     })
    }

    $('.togbase').click(function(e){
        e.preventDefault();
        $('.base_inputs').slideToggle();
    });

    $('.toglive').click(function(e){
        e.preventDefault();
        //$('.live').toggle();

        //$(this).text('show live tests');
        var txt = $(".live").is(':visible') ? 'show live tests' : 'hide live tests';
        $(".toglive").text(txt);
        $(".live").slideToggle();
    });

    document.getElementById("btnSaveBases").addEventListener("click", function(){
      saveBase("base1", document.getElementById("base1").value);
      saveBase("base2", document.getElementById("base2").value);
      saveBase("base3", document.getElementById("base3").value);
      saveBase("base4", document.getElementById("base4").value);
      saveBase("base5", document.getElementById("base5").value);
      saveBase("base6", document.getElementById("base6").value);
      getBaseJson();
      $('.base_inputs').hide();

    });


    getBaseJson();
    
});