const MODEL = (function() {
    var allMPs = [];
    var filteredMPs = [];

    /**
     * Returns a promise of all MP:s. NEEDS REJECT OPTION
     * Originally fetched from: http://data.riksdagen.se/personlista/?iid=&fnamn=&enamn=&f_ar=&kn=&parti=&valkrets=&rdlstatus=&org=&utformat=json&termlista=
     * But now fetched locally since it's very big and doesn't change very often.
     */
    function fetchAllMPs() {
        return fetch("json/rawMPs.json")
            .then(response => response.json())
            .then(data => slimArray(data));
    }

    /**
     * Returns a slimmer array of MP:s with the props i need
     * @param {array} mps - original raw array of MP:s
     */
    function slimArray(mps) {
        let mp = mps.personlista.person;
        for (let i in mp) {
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
        let fromDate = MODEL.oneMonthBack();
        let countComebacks = "Ja";

        for (let i in mps) {
            fetchObj = fetch(`http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=${countComebacks}&d=${fromDate}&ts=&parti=&iid=${mps[i].id}&sz=200&utformat=json`)
                .then(response => response.json())
                .then(data => addSpeech(data, i));
        }
        fetchObj.then(function() {
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
        return mps.sort((a, b) => a.numberofspeeches > b.numberofspeeches ? -1 : 1);
    }

    return {

        getArray: function(which) {
            return which === "all" ? allMPs : filteredMPs;
        },

        setArray: function(mps, which) {
            let sorted = sortNumberOfSpeeches(mps);
            return which === "all" ? allMPs = sorted : filteredMPs = sorted;
        },

        initMPObject: function() {
            fetchAllMPs();
        },
        /**
         * REVERTS CURRENT DATE ONE MONTH. NEEDS REMAKE (DEC BECOMES -1 INST OF 12)
         */
        oneMonthBack: function() {
            let date = new Date();
            return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
        }
    };
})();

const CONTROLLER = (function() {
    return {
        init: function() {
            VIEW.toggleLoadScreen();
            MODEL.initMPObject();
        },

        storeArray: function(mps, type) {
            console.log(mps);
            MODEL.setArray(mps, type);
            CONTROLLER.launchPrintToplist(type);
        },

        launchPrintToplist: function(type) {
            let toPrint = MODEL.getArray(type);
            VIEW.printTopList(toPrint);
        },

        openModal: function(event, mp) {
            VIEW.renderModal.call(mp);
            $("#mpModal").modal();
        }
    };
})();


const VIEW = (function() {

    /**
     * It was a nightmare to figure out how to append event listerners to all the toplist items. I tried every possible closure to get
     * the loop varables saved. Turns out the problem was probably the DOM selector operating in the same loop as the template literal.
     * I.e. an element was selected just as it was created. As soon as i made another loop everything just worked :/
     * @param {array} mps 
     */
    function listenersForToplist(mps) {
        for (let i in mps) {
            document.querySelector(`tr[data-id="${mps[i].id}"]`).
            addEventListener('click', CONTROLLER.openModal.bind(null, event, mps[i]));
        }
    }


    return {

        toggleLoadScreen: function() {
            const loadScreen = document.querySelector(".loading");
            loadScreen.classList.toggle("visible");
            loadScreen.classList.toggle("hidden");
        },

        printTopList: function(mps) {
            //console.log(mps);
            let top = 10;
            const toplist = document.getElementById("toplist");
            toplist.innerHTML = "";

            const toplistArr = [];

            for (let i = 0; i < top; i++) {
                toplist.innerHTML += `
            <tr data-id="${mps[i].id}">
                <td>${i + 1}</td>
                <td>
                    <div class="mp-img-container border-${mps[i].party}">
                        <img src="${mps[i].image}" class="mp-img" alt="${mps[i].firstname} ${mps[i].lastname}">
                    </div>
                </td>
                <td>${mps[i].firstname} ${mps[i].lastname} (${mps[i].party})</td>
                <td>${mps[i].numberofspeeches} anföranden</td>
            </tr>
            `;
                toplistArr.push(mps[i]);
            }
            listenersForToplist(toplistArr);
        },

        renderModal: function() {
            console.log(this);
            let speechList = speechSnippet(this);
            let modalBody = document.querySelector(".modal-content");
            modalBody.innerHTML =
                `
            <div class="modal-header">
                <h5 class="modal-title" id="mpModalLabel">${this.firstname} ${this.lastname} (${this.party})
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p>Född: ${this.born}. Valkrets: ${this.electorate}.
                <p>${this.firstname} har talat i Riksdagen ${this.numberofspeeches} gånger sedan
                    ${MODEL.oneMonthBack()}.
                </p>
                <p> Här är några av de saker som ${this.gender == "man" ? "han" : "hon"} har debatterat:</p>
                ${speechList}
            </div>
            
            `;
        },



        /**
         * first call picks upp mp-array and makes 300 ajax calls and creates
         * a live object.
         * second call is a dev bypass that cuts directly to sorting using 
         * a readymade array of objects.
         */
        init: (function() {
            //document.getElementById("getButton").addEventListener("click", CONTROLLER.init);
            document.getElementById("getButton").addEventListener("click", function() {
                CONTROLLER.storeArray(testMPs, "all");
            });
        })()
    };
})();


/**
 * FOO FOR CALC ALL SPEECHES
 */
// function totalNumberOfSpeeches(array) {
//     const totalSpeeches = array.reduce(function(prev, cur) {
//         return prev + cur.numberofspeeches;
//     }, 0);
// }