"use strict";

var MODEL = function () {
    var allMPs = [];
    var filteredMPs = [];

    /**
     * Returns a promise of all MP:s. NEEDS REJECT OPTION
     * Originally fetched from: http://data.riksdagen.se/personlista/?iid=&fnamn=&enamn=&f_ar=&kn=&parti=&valkrets=&rdlstatus=&org=&utformat=json&termlista=
     * But now fetched locally since it's very big and doesn't change very often.
     */
    function fetchAllMPs() {
        return fetch("json/rawMPs.json").then(function (response) {
            return response.json();
        });
    }

    /**
     * Returns a slimmer array of MP:s with the props i need
     * @param {array} mps - original raw array of MP:s
     */
    function slimArray(mps) {
        var mp = mps.personlista.person;
        var newArr = [];
        for (var i in mp) {
            newArr.push({
                id: mp[i].intressent_id,
                firstname: mp[i].tilltalsnamn,
                lastname: mp[i].efternamn,
                party: mp[i].parti,
                image: mp[i].bild_url_192
            });
        }
        return newArr;
    }

    function fetchDebates(mps, i, fromDate) {
        var countComebacks = "Ja";
        return fetch("http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=" + countComebacks + "&d=" + fromDate + "&ts=&parti=&iid=" + mps[i].id + "&sz=200&utformat=json").then(function (response) {
            return response.json();
        });
    }

    function addSpeech(data, i, newArr) {
        newArr[i].numberofspeeches = parseInt(data.anforandelista["@antal"]);
        if (data.anforandelista["@antal"] !== "0") {
            newArr[i].speeches = data.anforandelista.anforande;
        }
        return newArr[i];
    }

    /**
     * REVERTS CURRENT DATE ONE MONTH. NEEDS REMAKE (DEC BECOMES -1 INST OF 12)
     */
    function oneMonthBack() {
        var date = new Date();
        return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    }

    return {

        /**
         * Function in charge of returning my master array of MP-objects inc. all necessary info using several helper methods.
         * This is created on page load and then stored + printed. 
         */
        makeMasterMPArr: function makeMasterMPArr() {
            var fetchy = fetchAllMPs().then(function (data) {
                var newArr = slimArray(data);
                var fromDate = oneMonthBack();

                var _loop = function _loop(i) {
                    fetchDebates(newArr, i, fromDate).then(function (data) {
                        newArr[i] = addSpeech(data, i, newArr);
                    });
                };

                for (var i in newArr) {
                    _loop(i);
                }
                return newArr;
            });
            fetchy.then(function (result) {
                CONTROLLER.storeArray(result, "all");
            });
        },

        getArray: function getArray(which) {
            return which === "all" ? allMPs : filteredMPs;
        },

        setArray: function setArray(mps, which) {
            return which === "all" ? allMPs = mps : filteredMPs = mps;
        }
    };
}();

var CONTROLLER = function () {

    /**
     * SORTS: MAKES THE TOP LIST
     * @param {array} mps - mp array of objects
     */
    function sortNumberOfSpeeches(mps) {
        return mps.sort(function (a, b) {
            return a.numberofspeeches > b.numberofspeeches ? -1 : 1;
        });
    }

    function launchPrintToplist(type) {
        var toPrint = MODEL.getArray(type);
        VIEW.printTopList(toPrint);
    }

    return {

        /**
         * first call picks upp mp-array and makes 300 ajax calls and creates
         * a live object.
         * second call is a dev bypass that cuts directly to sorting using 
         * a readymade array of objects.
         */

        initMPObject: function initMPObject() {
            var mpObject = MODEL.makeMasterMPArr();
        },

        storeArray: function storeArray(mps, type) {
            MODEL.setArray(mps, type);
            launchPrintToplist(type);
        }

    };
}();

var VIEW = function () {

    return {
        printTopList: function printTopList(mps) {
            var top = 10;
            var toplist = document.getElementById("toplist");
            toplist.innerHTML = "";
            for (var i = 0; i < top; i++) {
                toplist.innerHTML += "\n        <tr data-id=\"" + mps[i].id + "\">\n            <td>" + (i + 1) + "</td>\n            <td>\n                <div class=\"mp-img-container border-" + mps[i].party + "\">\n                    <img src=\"" + mps[i].image + "\" class=\"mp-img\" alt=\"" + mps[i].firstname + " " + mps[i].lastname + "\">\n                </div>\n            </td>\n            <td>" + mps[i].firstname + " " + mps[i].lastname + " (" + mps[i].party + ")</td>\n            <td>" + mps[i].numberofspeeches + " anf\xF6randen</td>\n        </tr>\n        ";
            }
        },

        /**
         * EVENT LISTENERS
         */
        init: function () {
            document.getElementById("getButton").addEventListener("click", CONTROLLER.initMPObject);
        }()
    };
}();

/**
 * FOO FOR CALC ALL SPEECHES
 */
// function totalNumberOfSpeeches(array) {
//     const totalSpeeches = array.reduce(function(prev, cur) {
//         return prev + cur.numberofspeeches;
//     }, 0);
// }