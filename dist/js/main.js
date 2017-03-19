"use strict";

/**
 * EVENT LISTENERS
 */

(function () {
    document.addEventListener("DOMContentLoaded", start);
    //document.getElementById("getButton").addEventListener("click", fetchAllMPs);
    /**
     * above event listener picks upp mp-array and makes 300 ajax calls and creates
     * a live object.
     * below event listener bypasses all that & cuts directly to sorting using 
     * a placeholder array of objects.
     */
    document.getElementById("getButton").addEventListener("click", function () {
        sortNumberOfSpeeches(testMPs);
    });
})();

function start() {}

var STORE = function () {
    var allMPs = [];

    return {
        getMPs: function getMPs() {
            return allMPs;
        },

        setMPs: function setMPs() {}

    };
}();

//fetched from: http://data.riksdagen.se/personlista/?iid=&fnamn=&enamn=&f_ar=&kn=&parti=&valkrets=&rdlstatus=&org=&utformat=json&termlista=
function fetchAllMPs() {
    fetch("json/rawMPs.json").then(function (response) {
        return response.json();
    }).then(function (data) {
        return makeMyMPObjects(data);
    });
}

//making allmp:s an array of objects. MUST NOT BE GLOBAL


function makeMyMPObjects(MPs) {
    var personlista = MPs.personlista.person;
    for (var i in personlista) {
        allMPs.push({
            id: personlista[i].intressent_id,
            firstname: personlista[i].tilltalsnamn,
            lastname: personlista[i].efternamn,
            party: personlista[i].parti,
            image: personlista[i].bild_url_192
        });
    }
    fetchDebates(allMPs);
}

function fetchDebates(allMPs) {
    var fetchObj;
    var fromDate = oneMonthBack();
    var countComebacks = "Nej";

    var _loop = function _loop(i) {
        fetchObj = fetch("http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=" + countComebacks + "&d=" + fromDate + "&ts=&parti=&iid=" + allMPs[i].id + "&sz=200&utformat=json").then(function (response) {
            return response.json();
        }).then(function (data) {
            return addSpeechToObj(data, i);
        });
    };

    for (var i = 0; i < allMPs.length; i++) {
        _loop(i);
    }
    console.log(allMPs);

    fetchObj.then(function () {
        sortNumberOfSpeeches(allMPs);
    });
}

function addSpeechToObj(data, index) {
    allMPs[index].numberofspeeches = parseInt(data.anforandelista["@antal"]);
    if (data.anforandelista["@antal"] !== "0") {
        allMPs[index].speeches = data.anforandelista.anforande;
    }
}

/**
 * WORKING. SORTS: MAKES THE TOP LIST
 * @param {array} mps - mp array of objects
 */
function sortNumberOfSpeeches(mps) {
    var sortedMPs = mps.sort(function (a, b) {
        return a.numberofspeeches > b.numberofspeeches ? -1 : 1;
    });
    console.log(sortedMPs);
    printTopList(sortedMPs);
}

function printTopList(mps) {
    var top = 10;
    var toplist = document.getElementById("toplist");
    for (var i = 0; i < top; i++) {
        toplist.innerHTML += "\n        <tr data-id=\"" + mps[i].id + "\">\n            <td>" + (i + 1) + "</td>\n            <td>\n                <div class=\"mp-img-container border-" + mps[i].party + "\">\n                    <img src=\"" + mps[i].image + "\" class=\"mp-img\" alt=\"" + mps[i].firstname + " " + mps[i].lastname + "\">\n                </div>\n            </td>\n            <td>" + mps[i].firstname + " " + mps[i].lastname + " (" + mps[i].party + ")</td>\n            <td>" + mps[i].numberofspeeches + " anf\xF6randen</td>\n        </tr>\n        ";
    }
}

/**
 * REVERTS CURRENT DATE ONE MONTH. NEEDS REMAKE (DEC BECOMES -1 INST OF 12)
 */
function oneMonthBack() {
    var date = new Date();
    return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
}

/**
 * FOO FOR CALC ALL SPEECHES
 */
// function totalNumberOfSpeeches(array) {
//     const totalSpeeches = array.reduce(function(prev, cur) {
//         return prev + cur.numberofspeeches;
//     }, 0);
// }