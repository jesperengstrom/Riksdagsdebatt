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
        /**
         * Retrieves the array of MP:s from the model. Either all or a current selection depending on request.
         */
        getArray: function getArray(which) {
            return which === "all" ? allMPs : filteredMPs;
        },

        /**
         * Sorts the array of MP:s by no of speeches before storing it in the model.
         * Either all or a current selection depending on request.
         */
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
        },

        /**
         * I have to filter out my huge array on the basis of another array of
         * selections. So i go through each element with array.Filter - it it returns true or not depends on the result
         * of the nested array.Some which looks for any occurance in the other array.
         */
        filterMPs: function filterMPs(lookingfor) {
            var all = MODEL.getArray("all");
            var filtered = all.filter(function (mp) {
                return lookingfor.some(function (party) {
                    return party === mp.party;
                });
            });
            CONTROLLER.storeArray(filtered, "filtered");
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
            MODEL.setArray(mps, type);
            CONTROLLER.launchPrintToplist(type);
        },

        launchPrintToplist: function launchPrintToplist(type) {
            var toPrint = MODEL.getArray(type);
            if (toPrint.length === 0) console.log("control says: Array came back empty from storage");else console.log("To print:", toPrint);
            VIEW.printTopList(toPrint);
        },

        navClick: function navClick() {
            var clicked = this.firstChild.nodeValue;
            if (clicked == "Topplistan") CONTROLLER.launchPrintToplist("all");
            if (clicked == "Om") VIEW.printAbout();
            if (clicked == "Partitoppen") VIEW.printPartySummary();
            if (clicked == "Könsfördelning") VIEW.printGenderSummary();
        },

        partySelection: function partySelection(elems) {
            var selection = [];
            elems.forEach(function (element) {
                if (element.classList.contains("activeParty")) {
                    selection.push(element.firstChild.nodeValue);
                }
            });
            MODEL.filterMPs(selection);
        },
        /**
         * Opens modal window for each MP. Sudden jQuery-syntax is advised from Bootstrap documentation.
         */
        openModal: function openModal(event, mp) {
            VIEW.renderModal.call(mp);
            $("#mpModal").modal();
        }
    };
}();

var VIEW = function () {

    /**
     * It was a nightmare to figure out how to append event listerners to all the toplist items. I tried every possible closure to get
     * not only the last one to stick. Turns out the problem was probably the DOM selector operating in the same 
     * loop as the template literal? Don't know why really. But soon as i made another loop everything just worked :/
     * @param {array} mps 
     */
    function listenersForToplist(mps) {
        for (var i in mps) {
            document.querySelector("tr[data-id=\"" + mps[i].id + "\"]").addEventListener('click', CONTROLLER.openModal.bind(null, event, mps[i]));
        }
    }

    /**
     * You can often remove a lot of things in these topic descriptions. For ex "svar på interpellation 1235 om..." after the "om" follows
     * the real issue, so i extract everything after the "om", capitalize the first letter and return.
     * @param {string} string - topic of the speech
     */
    function trimString(string) {
        var newString = string;
        var search = newString.indexOf(" om ");
        if (search > 0) {
            var temp = newString.substring(search + 4, newString.length);
            temp = capitalizeFirst(temp);
            newString = temp;
        }
        return newString;
    }

    function capitalizeFirst(str) {
        if (str) {
            str = str[0].toUpperCase() + str.substring(1, str.length);
        }
        return str;
    }

    function speechSnippet() {
        var string = "";
        var count = 0;
        var sp = this.speeches;
        var eMega = "<i class=\"em em-mega pull-right\"> </i>";
        var eSpeech = "<i class=\"em em-speech_balloon pull-right\"> </i>";

        if (!sp) return "Inga debatter";

        for (var i in sp) {
            //if the previous debate was the same as this one, then skip it.
            //the loose compare is important since it accepts "0".
            if (i == 0 || sp[i].avsnittsrubrik !== sp[i - 1].avsnittsrubrik) {
                //byt till anforande_url_xml om tid finns
                string += "<li><a href=\"" + sp[i].protokoll_url_www + "\" target=\"_blank\">" + (sp[i].replik == "Y" ? "<span class=\"comeback-debate debate-topic\">" : "<span class=\"own-debate debate-topic\">") + trimString(sp[i].avsnittsrubrik) + " \n                        </span></a>\n                        <span class=\"debate-context\">" + (capitalizeFirst(sp[i].kammaraktivitet) || "") + " " + sp[i].dok_datum + ".</span> \n                        ";
                count++;
                //If the next topic will be a new one, close the list item.
                if (i > sp.length - 1 && sp[i].avsnittsrubrik !== sp[i + 1].avsnittsrubrik) string += "</li>";

                //instead print out an emoji
            } else string += "<span class=\"additional-entries\">" + (sp[i].replik == "Y" ? eSpeech : eMega);

            if (count === 10) break;
        }
        return string;
    }

    return {

        toggleLoadScreen: function toggleLoadScreen() {
            var loadScreen = document.querySelector(".loading");
            loadScreen.classList.toggle("visible");
            loadScreen.classList.toggle("hidden");
        },

        printTopList: function printTopList(mps) {
            //console.log(mps);
            var toplist = document.getElementById("toplist");
            var max = 10;
            var toplistArr = [];
            toplist.innerHTML = "";
            if (mps.length === 0) {
                toplist.innerHTML = "<p>Oops, det finns ingen data att visa</p>";
                return;
            }
            //keep printing the toplist until you reach the end or the max.
            for (var i = 0; i < max && i < mps.length; i++) {
                toplist.innerHTML += "\n            <tr data-id=\"" + mps[i].id + "\">\n                <td>" + (i + 1) + "</td>\n                <td>\n                    <div class=\"mp-img-container border-" + mps[i].party + "\">\n                        <img src=\"" + mps[i].image + "\" class=\"mp-img\" alt=\"" + mps[i].firstname + " " + mps[i].lastname + "\">\n                    </div>\n                </td>\n                <td>" + mps[i].firstname + " " + mps[i].lastname + " (" + mps[i].party + ")</td>\n                <td>" + mps[i].numberofspeeches + " debattinl\xE4gg</td>\n            </tr>\n            ";
                toplistArr.push(mps[i]);
            }
            listenersForToplist(toplistArr);
        },
        printAbout: function printAbout() {
            alert("om");
        },

        printPartySummary: function printPartySummary() {
            alert("partisummering");
        },

        printGenderSummary: function printGenderSummary() {
            alert("könsfördelning");
        },

        renderModal: function renderModal() {
            var speechList = speechSnippet.call(this);
            var modalBody = document.querySelector(".modal-content");
            modalBody.innerHTML = "\n            <div class=\"modal-header\">\n                <h5 class=\"modal-title\" id=\"mpModalLabel\">" + this.firstname + " " + this.lastname + " (" + this.party + ")\n                </h5>\n                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n                    <span aria-hidden=\"true\">&times;</span>\n                </button>\n            </div>\n            <div class=\"modal-body\">\n                <p>F\xF6dd: " + this.born + ". Valkrets: " + this.electorate + ".\n                <p>" + this.firstname + " har debatterat i Riksdagen vid " + this.numberofspeeches + " tillf\xE4llen sedan\n                    " + MODEL.oneMonthBack() + ". <br>\n                    H\xE4r \xE4r n\xE5gra av de senaste fr\xE5gorna " + (this.gender == "man" ? "han" : "hon") + " har talat om:\n                </p>\n                <ul>\n                " + speechList + "\n                </ul>\n                                <span class=\"own-debate debate-topic\">     </span> = Eget anf\xF6rande\n                <span class=\"comeback-debate debate-topic\">     </span> = Replik p\xE5 n\xE5gon annan <br>\n                <i class=\"em em-mega\"></i><i class=\"em em-speech_balloon\"></i> = " + this.firstname + " har flera inl\xE4gg i den h\xE4r debatten.\n            </div>\n            <div class=\"modal-footer\">\n\n            </div>\n            ";
        },

        /**
         * EVENT LISTENERS FOR NON-DYNAMIC ELEMENTS
         * 1) first call picks upp mp-array and makes 300 ajax calls and creates
         * a live object.
         * 2) second call is a dev bypass that cuts directly to sorting using 
         * a readymade array of objects.
         */
        init: function () {
            //1)
            //document.getElementById("getButton").addEventListener("click", CONTROLLER.init);
            //2
            document.getElementById("getButton").addEventListener("click", function () {
                CONTROLLER.storeArray(testMPs, "all");
            });

            /**
             * event listeners for my menu items, since nothing on the page is a hyperlink, just JS.
             * Sends all of the nav-element to a controller function which then decides which one was clicked via 'this'.
             */
            document.querySelectorAll(".launch-nav-event").forEach(function (element) {
                element.addEventListener("click", CONTROLLER.navClick);
            }, this);

            /**
             * Same concept with my listeners for party filtering, except I toggle a class and lets the controller function check
             * which ones are 'active', ie selected.
             */
            var partyBtns = document.querySelectorAll(".partyBtn");
            partyBtns.forEach(function (element) {
                element.addEventListener("click", function () {
                    this.classList.toggle("activeParty");
                    CONTROLLER.partySelection(partyBtns);
                });
            }, this);
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