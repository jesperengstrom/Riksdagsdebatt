"use strict";

//MP = Member of Parliament

/**
 * MODEL module - handles app logic & data
 */
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
     * Sorts the array passed in by value of the given prop. To sort toplist + chart.
     * * @param {array} arr - array to be sorted 
     * * @param {string} prop - property to sort 
     */
    function sortNumberOfSpeeches(arr, prop) {
        return arr.sort(function (a, b) {
            return a[prop] > b[prop] ? -1 : 1;
        });
    }

    /**
     * calcs the total number of speeches in the array recieved and returns the number
     */
    function totalSpeeches(mps) {
        return mps.reduce(function (total, cur) {
            return total + cur.numberofspeeches;
        }, 0);
    }

    /**
     * Before we can print the chart, we need to format data in a way that Chartist.js accepts.
     * * @param {array} indata - the data to be displayed in the chart.
     */
    function formatChartObj(indata) {
        //template object
        var data = {
            labels: [],
            series: [[]]
        };
        //since Chartist don't support setting bar colors via the API, Im adding a meta tag and append 
        //the corresponding class to the SVG element later on draw..phew
        indata.forEach(function (element) {
            data.labels.push(element.label);
            data.series[0].push({ value: element.quota, className: "bar-" + element.label });
        }, this);
        return data;
    }

    return {

        /**
         * Retrieves the array of MP:s from the model. 
         *  * @param {string} which - Either all or a current selection depending on request.
         */
        getArray: function getArray(which) {
            return which === "all" ? allMPs : filteredMPs;
        },

        /**
         * Sorts and stores the array of MP: in the model. 
         * * @param {array} mps - array of mp:s to store.
         * * @param {string} which - store all or current selection depending on request.
         */
        setArray: function setArray(mps, which) {
            var sorted = sortNumberOfSpeeches(mps, "numberofspeeches");
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
         * Returns an array of objects with the total number of speeches by a certain category (party/gender). 
         * Also the number of members in that category and the quota of the two.
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
            temp = sortNumberOfSpeeches(temp, "quota");
            var result = formatChartObj(temp);
            return result;
        },

        getSpeech: function getSpeech(event, arr) {
            console.log(arr.replik);
        }
    };
}();

/**
 * CONTROLLER module - directs communication
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
        getPartySelection: function getPartySelection(elems) {
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
            VIEW.printModal.call(mp);
            $("#mpModal").modal();
        }
    };
}();

/**
 * VIEW module - Handles everything u see & interact with
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
     * Making speeches clickable
     * @param {array} speeches - array of speeches that is printed in the modal
     */
    function listenersForSpeeches(speeches) {
        for (var i in speeches) {
            document.getElementById(speeches[i].anforande_id).addEventListener('click', MODEL.getSpeech.bind(null, event, speeches[i]));
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
     * capital first letter of a string
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
    function printSpeechList() {
        var ul = document.getElementById("modal-speech-list"),
            speechArr = [],
            string = "",
            count = 0;
        var sp = this.speeches,
            eMega = "<i class=\"em em-mega\"> </i>",
            eSpeech = "<i class=\"em em-speech_balloon\"> </i>";

        //no speeches
        if (!sp) return "<i class=\"em em-disappointed\"></i>";

        for (var i in sp) {

            //if the previous debate was the same as this one, then skip it...
            //the loose compare is important since it accepts "0".
            if (i == 0 || sp[i].avsnittsrubrik !== sp[i - 1].avsnittsrubrik) {

                string += "<li> \n                            <span class=\"" + (sp[i].replik == "Y" ? "comeback" : "own") + "-debate debate-topic\" id=\"" + sp[i].anforande_id + "\">\n                            " + trimString(sp[i].avsnittsrubrik) + "</span>\n                            <span class=\"debate-context\">" + (capitalizeFirst(sp[i].kammaraktivitet) || "") + " " + sp[i].dok_datum + ".</span> \n                            ";
                count++;

                //If the next topic will be a new one, close the list item.
                if (i > sp.length - 1 && sp[i].avsnittsrubrik !== sp[i + 1].avsnittsrubrik) string += "</li>";

                //... instead print out an emoji
            } else string += "<i id=\"" + sp[i].anforande_id + "\" class=\"em em-" + (sp[i].replik == "Y" ? "speech_balloon" : "mega") + "\"></i>";

            speechArr.push(sp[i]);
            if (count === 10) break;
        }
        //can's just return the string to parent function because then the event listeners be created before the elements = fail. 
        ul.innerHTML = string;
        listenersForSpeeches(speechArr);
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
         * 
         * * @param {object} data - data to be displayed in the chart
         * * @param {string} which - are we creating gender/party chart?
         * Chart itself is made in chart_animation.js
         */
        printChart: function printChart(data, which) {
            console.log(data);

            if (which === "partyChart") {
                CHART.makePartyChart(data);
            }
            if (which === "genderChart") {
                CHART.makeGenderChart(data);
            }
        },

        /**
         * Prints a modal that pop up when you click an MP.
         */
        printModal: function printModal() {
            //getting code for this list of speeches
            var modalBody = document.querySelector(".modal-content");

            //setting the more static content as variables..
            var headerContent = this.firstname + " " + this.lastname + " (" + this.party + ")";
            var lastLine = this.speeches ? "<br>H\xE4r \xE4r n\xE5gra av de senaste fr\xE5gorna " + (this.gender == "man" ? "han" : "hon") + " har talat om:</p>" : "<br>D\xE4rf\xF6r finns det inget att visa h\xE4r.</p>";

            var bodyFacts = "\n            <p>F\xF6dd: " + this.born + ". Valkrets: " + this.electorate + ".</p>\n            <p>" + this.firstname + " har debatterat i Riksdagen vid " + this.numberofspeeches + " tillf\xE4llen sedan " + MODEL.oneMonthBack() + ". \n            " + lastLine + "\n            ";

            //..inserting them in the modal template literal.
            modalBody.innerHTML = "\n            <div class=\"modal-header\">\n                <h5 class=\"modal-title\" id=\"mpModalLabel\">\n                " + headerContent + "\n                </h5>\n                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n                    <span aria-hidden=\"true\">&times;</span>\n                </button>\n            </div>\n            <div class=\"modal-body\">\n                " + bodyFacts + "\n                <hr>\n                <ul id=\"modal-speech-list\">\n                </ul>\n                <hr>\n                <span class=\"own-debate debate-topic\">     </span> = Eget anf\xF6rande\n                <span class=\"comeback-debate debate-topic\">     </span> = Replik p\xE5 n\xE5gon annan <br>\n                <i class=\"em em-mega\"></i><i class=\"em em-speech_balloon\"></i> = " + this.firstname + " har flera inl\xE4gg i den h\xE4r debatten.\n            </div>\n            ";
            //Need to print speechlist as the last thing
            printSpeechList.call(this);
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
                    CONTROLLER.getPartySelection(partyBtns);
                });
            }, this);
        }()
    };
}();