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
        }).then(function (data) {
            return slimArray(data);
        });
    }

    /**
     * Returns a slimmer array of MP:s with the props i need
     * @param {array} mps - original raw array of MP:s
     */
    function slimArray(mps) {
        var mp = mps.personlista.person;
        for (var i in mp) {
            allMPs.push({
                id: mp[i].intressent_id,
                firstname: mp[i].tilltalsnamn,
                lastname: mp[i].efternamn,
                party: mp[i].parti,
                gender: mp[i].kon,
                born: mp[i].fodd_ar,
                electorate: mp[i].valkrets,
                image: mp[i].bild_url_192
            });
        }
        fetchDebates(allMPs);
    }

    function fetchDebates(mps) {
        var fetchObj;
        var fromDate = MODEL.oneMonthBack();
        var countComebacks = "Ja";

        var _loop = function _loop(i) {
            fetchObj = fetch("http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=" + countComebacks + "&d=" + fromDate + "&ts=&parti=&iid=" + mps[i].id + "&sz=200&utformat=json").then(function (response) {
                return response.json();
            }).then(function (data) {
                return addSpeech(data, i);
            });
        };

        for (var i in mps) {
            _loop(i);
        }
        fetchObj.then(function () {
            CONTROLLER.storeArray(allMPs, "all");
            VIEW.toggleLoadScreen();
        });
    }

    function addSpeech(data, i) {
        allMPs[i].numberofspeeches = parseInt(data.anforandelista["@antal"]);
        if (data.anforandelista["@antal"] !== "0") {
            allMPs[i].speeches = data.anforandelista.anforande;
        }
    }

    /**
     * SORTS: MAKES THE TOP LIST
     * @param {array} mps - mp array of objects
     */
    function sortNumberOfSpeeches(mps) {
        return mps.sort(function (a, b) {
            return a.numberofspeeches > b.numberofspeeches ? -1 : 1;
        });
    }

    return {

        getArray: function getArray(which) {
            return which === "all" ? allMPs : filteredMPs;
        },

        setArray: function setArray(mps, which) {
            var sorted = sortNumberOfSpeeches(mps);
            return which === "all" ? allMPs = sorted : filteredMPs = sorted;
        },

        initMPObject: function initMPObject() {
            fetchAllMPs();
        },
        /**
         * REVERTS CURRENT DATE ONE MONTH. NEEDS REMAKE (DEC BECOMES -1 INST OF 12)
         */
        oneMonthBack: function oneMonthBack() {
            var date = new Date();
            return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
        }
    };
}();

var CONTROLLER = function () {
    return {
        init: function init() {
            VIEW.toggleLoadScreen();
            MODEL.initMPObject();
        },

        storeArray: function storeArray(mps, type) {
            console.log(mps);
            MODEL.setArray(mps, type);
            CONTROLLER.launchPrintToplist(type);
        },

        launchPrintToplist: function launchPrintToplist(type) {
            var toPrint = MODEL.getArray(type);
            VIEW.printTopList(toPrint);
        },

        openModal: function openModal(event, mp) {
            VIEW.renderModal.call(mp);
            $("#mpModal").modal();
        }
    };
}();

var VIEW = function () {

    /**
     * It was a nightmare to figure out how to append event listerners to all the toplist items. I tried every possible closure to get
     * the loop varables saved. Turns out the problem was probably the DOM selector operating in the same loop as the template literal.
     * I.e. an element was selected just as it was created. As soon as i made another loop everything just worked :/
     * @param {array} mps 
     */
    function listenersForToplist(mps) {
        for (var i in mps) {
            document.querySelector("tr[data-id=\"" + mps[i].id + "\"]").addEventListener('click', CONTROLLER.openModal.bind(null, event, mps[i]));
        }
    }

    return {

        toggleLoadScreen: function toggleLoadScreen() {
            var loadScreen = document.querySelector(".loading");
            loadScreen.classList.toggle("visible");
            loadScreen.classList.toggle("hidden");
        },

        printTopList: function printTopList(mps) {
            //console.log(mps);
            var top = 10;
            var toplist = document.getElementById("toplist");
            toplist.innerHTML = "";

            var toplistArr = [];

            for (var i = 0; i < top; i++) {
                toplist.innerHTML += "\n            <tr data-id=\"" + mps[i].id + "\">\n                <td>" + (i + 1) + "</td>\n                <td>\n                    <div class=\"mp-img-container border-" + mps[i].party + "\">\n                        <img src=\"" + mps[i].image + "\" class=\"mp-img\" alt=\"" + mps[i].firstname + " " + mps[i].lastname + "\">\n                    </div>\n                </td>\n                <td>" + mps[i].firstname + " " + mps[i].lastname + " (" + mps[i].party + ")</td>\n                <td>" + mps[i].numberofspeeches + " anf\xF6randen</td>\n            </tr>\n            ";
                toplistArr.push(mps[i]);
            }
            listenersForToplist(toplistArr);
        },

        renderModal: function renderModal() {
            console.log(this);
            var speechList = speechSnippet(this);
            var modalBody = document.querySelector(".modal-content");
            modalBody.innerHTML = "\n            <div class=\"modal-header\">\n                <h5 class=\"modal-title\" id=\"mpModalLabel\">" + this.firstname + " " + this.lastname + " (" + this.party + ")\n                </h5>\n                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n                    <span aria-hidden=\"true\">&times;</span>\n                </button>\n            </div>\n            <div class=\"modal-body\">\n                <p>F\xF6dd: " + this.born + ". Valkrets: " + this.electorate + ".\n                <p>" + this.firstname + " har talat i Riksdagen " + this.numberofspeeches + " g\xE5nger sedan\n                    " + MODEL.oneMonthBack() + ".\n                </p>\n                <p> H\xE4r \xE4r n\xE5gra av de saker som " + (this.gender == "man" ? "han" : "hon") + " har debatterat:</p>\n                " + speechList + "\n            </div>\n            \n            ";
        },

        /**
         * first call picks upp mp-array and makes 300 ajax calls and creates
         * a live object.
         * second call is a dev bypass that cuts directly to sorting using 
         * a readymade array of objects.
         */
        init: function () {
            //document.getElementById("getButton").addEventListener("click", CONTROLLER.init);
            document.getElementById("getButton").addEventListener("click", function () {
                CONTROLLER.storeArray(testMPs, "all");
            });
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