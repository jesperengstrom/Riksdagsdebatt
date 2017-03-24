"use strict";

var MODEL = function () {
    var allMPs = [];
    var filteredMPs = [];

    /**
     * Returns a promise of all MP:s. NEEDS ERROR HANDLING
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
        //Fetch is done, we're ready to store array and send to print
        fetchObj.then(function () {
            CONTROLLER.storeArray(allMPs, "all");
        });
    }

    function addSpeech(data, i) {
        allMPs[i].numberofspeeches = parseInt(data.anforandelista["@antal"]);
        if (data.anforandelista["@antal"] !== "0") {
            allMPs[i].speeches = data.anforandelista.anforande;
            console.log("getting speeches");
        }
    }

    /**
     * Sorts the array passed in by speeches, i.e making the top list
     */
    function sortNumberOfSpeeches(mps) {
        return mps.sort(function (a, b) {
            return a.numberofspeeches > b.numberofspeeches ? -1 : 1;
        });
    }

    /**
     * calcs the total number of speeches in the array recieved and returns the number
     * @param {array} mps 
     */
    function totalSpeeches(mps) {
        return mps.reduce(function (total, cur) {
            return total + cur.numberofspeeches;
        }, 0);
    }

    /**
     * Before we can print the chart, we need to format data in a way that chart.js accepts + add colors
     * @param {array} indata - the data to be displayed in the chart.
     */
    function formatChartObj(indata) {
        //template object
        var data = {
            labels: [],
            datasets: [{
                label: "My First dataset",
                backgroundColor: [],
                borderColor: [],
                borderWidth: 1,
                data: []
            }]
        };

        console.log(indata);
        indata.forEach(function (element) {
            data.labels.push(element.label);
            data.datasets[0].backgroundColor.push('rgba(255, 99, 132, 0.2)');
            data.datasets[0].borderColor.push('rgba(255, 99, 132, 0.2)');
            data.datasets[0].data.push(element.quota);
        }, this);

        return data;
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
         * I have to filter out my huge array on the basis of another array of selections. 
         * So i go through each element with array.Filter - it it returns true or not depends on the result
         * of the nested array.Some which looks for any occurance in the other array.
         * * @param {array} lookingfor - array of strings (party names / gender?) that I want to filter
         * * @param {string} prop - the property that i want to target
         */
        filterMPs: function filterMPs(lookingfor, prop) {
            var all = MODEL.getArray("all");
            var filtered = all.filter(function (mp) {
                return lookingfor.some(function (thing) {
                    return thing === mp[prop];
                });
            });
            return filtered;
        },

        /**
         * Making use of the filterMPs and totalSpeeches functions to return an array of objects with 
         * the total number of speeches by a certain category (party/gender). Also the number of members in that 
         * category and the quota of the two. Objecs are constructed so they will eventuelly fit charts.js.
         * * @param {string} prop - I want to sum the values in this property
         */
        sumSpeechesBy: function sumSpeechesBy(prop) {
            var temp = [];
            var categories = [];
            if (prop == "party") {
                categories = ["S", "V", "MP", "M", "L", "C", "KD", "SD", "-"];
            }

            if (prop == "gender") {
                categories = ["man", "kvinna"];
            }
            //no need to count the total?
            // let all = MODEL.getArray("all");
            // let total = totalSpeeches(all);

            categories.forEach(function (category) {
                var numMps = MODEL.filterMPs([category], prop).length;
                var numSpeeches = totalSpeeches(MODEL.filterMPs([category], prop));

                temp.push({
                    label: category,
                    mps: numMps,
                    speeches: numSpeeches,
                    quota: Math.round(numSpeeches / numMps * 100) / 100
                });
            });
            var result = formatChartObj(temp);
            console.log(result);
            return result;
        }
    };
}();

/**
 * CONTROLLER MODULE - CONTROLS COMMUNICATION
 */
var CONTROLLER = function () {

    /**
     * gets the right (type) of array and then sends it to print.
     * Hides all other sections. Cause it's kind of a hub, it also console.logs some stuff.
     * @param {string} type - what to print all or filtered list
     */
    function prepareToPrintToplist(type) {
        var toPrint = MODEL.getArray(type);
        if (toPrint.length === 0) console.log("control says: Array came back empty from storage");else console.log("To print:", toPrint);

        VIEW.hideAllButMe("toplist-section");
        VIEW.printTopList(toPrint);
    }

    return {

        /**
         * Inits on page load. Triggers the loading-section
         */
        init: function init() {
            VIEW.hideAllButMe("loading-section");
            MODEL.initMPObject();
        },

        /**
         * Stores and sends to print the (right type) array
         * * @param {array} mps - the array of MPs
         * * @param {string} type - in which array to store - "all" or "filtered"
         */
        storeArray: function storeArray(mps, type) {
            MODEL.setArray(mps, type);
            prepareToPrintToplist(type);
        },

        /**
         * Gets sent an element that was clicked in the nav bar.
         * Depening on which one, the right function runs and all other sections are hidden.
         */
        navClick: function navClick() {
            //switch case could be used here
            var clicked = this.firstChild.nodeValue;

            if (clicked == "Topplistan") {
                prepareToPrintToplist("all");
            }

            if (clicked == "Om") {
                VIEW.hideAllButMe("about-section");
            }

            if (clicked == "Partitoppen") {
                var votesbyParty = MODEL.sumSpeechesBy("party");
                //adding a string as caller id. both charts use the same method, but I need to create separate charts.
                VIEW.printChart(votesbyParty, "partyChart");
                VIEW.hideAllButMe("party-chart-section");
            }
            if (clicked == "Könsfördelning") {
                var votesByGender = MODEL.sumSpeechesBy("gender");
                VIEW.printChart(votesByGender, "genderChart");
                VIEW.hideAllButMe("gender-chart-section");
            }
        },

        /**
         * Extracts the strings from the active buttons - i.e the names of parties I want to filter out.
         * These are pushed to an array and then sent to filterMPs - returning the mp-objects that match.
         * Then sent to storage.
         * * @param {nodeList} elems - the list of toggle buttons for filtering parties.
         */
        partySelection: function partySelection(elems) {
            var selection = [];
            elems.forEach(function (element) {
                if (element.classList.contains("activeParty")) {
                    selection.push(element.firstChild.nodeValue);
                }
            });
            var filtered = MODEL.filterMPs(selection, "party");
            CONTROLLER.storeArray(filtered, "filtered");
        },

        /**
         * Opens modal window for each MP. Sudden jQuery-syntax comes from Bootstrap documentation.
         */
        openModal: function openModal(event, mp) {
            VIEW.renderModal.call(mp);
            $("#mpModal").modal();
        }
    };
}();

/**
 * VIEW MODULE - HANDLES EVERYTHING UI 
 */
var VIEW = function () {

    /**
     * It was a nightmare to figure out how to append event listerners to all the toplist items. I tried every possible closure to get
     * not only the last one to stick. Turns out the problem was probably the DOM selector operating in the same 
     * loop as the template literal? As soon as i made ANOTHER loop everything just worked :/
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

    /**
     * capital first letter of str
     * @param {string} str 
     */
    function capitalizeFirst(str) {
        if (str) {
            str = str[0].toUpperCase() + str.substring(1, str.length);
        }
        return str;
    }

    /**
     * returns the template literal list of speeches code to the main modal printing function.
     */
    function speechSnippet() {
        var string = "";
        var count = 0;
        var sp = this.speeches;
        var eMega = "<i class=\"em em-mega pull-right\"> </i>";
        var eSpeech = "<i class=\"em em-speech_balloon pull-right\"> </i>";

        if (!sp) return "<i class=\"em em-disappointed\"></i>";

        for (var i in sp) {
            //if the previous debate was the same as this one, then skip it...
            //the loose compare is important since it accepts "0".
            if (i == 0 || sp[i].avsnittsrubrik !== sp[i - 1].avsnittsrubrik) {
                //byt till anforande_url_xml om tid finns
                string += "<li><a href=\"" + sp[i].protokoll_url_www + "\" target=\"_blank\">" + (sp[i].replik == "Y" ? "<span class=\"comeback-debate debate-topic\">" : "<span class=\"own-debate debate-topic\">") + trimString(sp[i].avsnittsrubrik) + " \n                        </span></a>\n                        <span class=\"debate-context\">" + (capitalizeFirst(sp[i].kammaraktivitet) || "") + " " + sp[i].dok_datum + ".</span> \n                        ";
                count++;
                //If the next topic will be a new one, close the list item.
                if (i > sp.length - 1 && sp[i].avsnittsrubrik !== sp[i + 1].avsnittsrubrik) string += "</li>";

                //... instead print out an emoji
            } else string += "<span class=\"additional-entries\">" + (sp[i].replik == "Y" ? eSpeech : eMega);

            if (count === 10) break;
        }
        return string;
    }

    /**
     * HTML-page consists of 3 sections that corresponds to three 
     * features of the page: to print a toplist, to display a chart and to display an about-text (+loading).
     * Following three functions print these sections using helper methods.
     */

    return {

        printTopList: function printTopList(mps) {
            var toplist = document.getElementById("toplist");
            var max = 10;
            //make a new arr of the items printed so I can add event listeners for them
            var toplistArr = [];
            toplist.innerHTML = "";
            if (mps.length === 0) {
                toplist.innerHTML = "<p>Oops, det finns ingen data att visa</p>";
                return;
            }
            //keep printing the toplist until you reach the end of arr OR max value.
            for (var i = 0; i < max && i < mps.length; i++) {
                toplist.innerHTML += "\n            <tr data-id=\"" + mps[i].id + "\">\n                <td>" + (i + 1) + "</td>\n                <td>\n                    <div class=\"mp-img-container border-" + mps[i].party + "\">\n                        <img src=\"" + mps[i].image + "\" class=\"mp-img\" alt=\"" + mps[i].firstname + " " + mps[i].lastname + "\">\n                    </div>\n                </td>\n                <td>" + mps[i].firstname + " " + mps[i].lastname + " (" + mps[i].party + ")</td>\n                <td>" + mps[i].numberofspeeches + " debattinl\xE4gg</td>\n            </tr>\n            ";
                toplistArr.push(mps[i]);
            }
            listenersForToplist(toplistArr);
        },

        /**
         * Makes a new chart object and inserts the data, rendering a new chart.
         * * @param {object} data - data to be displayed in the chart
         * * @param {string} which - are we creating gender/party chart?
         */
        printChart: function printChart(data, which) {
            var target = document.getElementById(which).getContext("2d");
            if (which === "partyChart") {
                var partyChart = new Chart(target, {
                    type: "bar",
                    data: data
                });
            }
            if (which === "genderChart") {
                var genderChart = new Chart(target, {
                    type: "bar",
                    data: data
                });
            }
        },

        /**
         * First hides all the main sections.
         ** @param {string} section - this section is set to visible
         */
        hideAllButMe: function hideAllButMe(section) {
            document.getElementById("loading-section").className = "hidden";
            document.getElementById("toplist-section").className = "hidden";
            document.getElementById("gender-chart-section").className = "hidden";
            document.getElementById("party-chart-section").className = "hidden";
            document.getElementById("about-section").className = "hidden";

            document.getElementById(section).className = "visible";
        },

        /**
         * Prints a modal that pop up when you click an MP.
         */
        renderModal: function renderModal() {
            //getting code for this list of speeches
            var speechList = speechSnippet.call(this);
            var modalBody = document.querySelector(".modal-content");

            //setting the more static content as variables..
            var headerContent = this.firstname + " " + this.lastname + " (" + this.party + ")";
            var lastLine = this.speeches ? "<br>H\xE4r \xE4r n\xE5gra av de senaste fr\xE5gorna " + (this.gender == "man" ? "han" : "hon") + " har talat om:</p>" : "<br>D\xE4rf\xF6r finns det inget att visa h\xE4r.</p>";

            var bodyFacts = "\n            <p>F\xF6dd: " + this.born + ". Valkrets: " + this.electorate + ".</p>\n            <p>" + this.firstname + " har debatterat i Riksdagen vid " + this.numberofspeeches + " tillf\xE4llen sedan " + MODEL.oneMonthBack() + ". \n            " + lastLine + "\n            ";

            //..inserting them in the modal template literal.
            modalBody.innerHTML = "\n            <div class=\"modal-header\">\n                <h5 class=\"modal-title\" id=\"mpModalLabel\">\n                " + headerContent + "\n                </h5>\n                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n                    <span aria-hidden=\"true\">&times;</span>\n                </button>\n            </div>\n            <div class=\"modal-body\">\n                " + bodyFacts + "\n                <hr>\n                <ul>\n                " + speechList + "\n                </ul>\n                <hr>\n                <span class=\"own-debate debate-topic\">     </span> = Eget anf\xF6rande\n                <span class=\"comeback-debate debate-topic\">     </span> = Replik p\xE5 n\xE5gon annan <br>\n                <i class=\"em em-mega\"></i><i class=\"em em-speech_balloon\"></i> = " + this.firstname + " har flera inl\xE4gg i den h\xE4r debatten.\n            </div>\n            ";
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
                VIEW.hideAllButMe("toplist-section");
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