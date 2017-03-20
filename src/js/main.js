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
            .then(response => response.json());
    }

    /**
     * Returns a slimmer array of MP:s with the props i need
     * @param {array} mps - original raw array of MP:s
     */
    function slimArray(mps) {
        let mp = mps.personlista.person;
        let newArr = [];
        for (let i in mp) {
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
        let countComebacks = "Ja";
        return fetch(`http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=${countComebacks}&d=${fromDate}&ts=&parti=&iid=${mps[i].id}&sz=200&utformat=json`)
            .then(response => response.json());

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
        let date = new Date();
        return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    }

    return {

        /**
         * Function in charge of returning my master array of MP-objects inc. all necessary info using several helper methods.
         * This is created on page load and then stored + printed. 
         */
        makeMasterMPArr: function() {
            let fetchy = fetchAllMPs().then(data => {
                let newArr = slimArray(data);
                let fromDate = oneMonthBack();
                for (let i in newArr) {
                    fetchDebates(newArr, i, fromDate)
                        .then(data => {
                            newArr[i] = addSpeech(data, i, newArr);
                        });
                }
                return newArr;
            });
            fetchy.then(function(result) {
                CONTROLLER.storeArray(result, "all");
            });
        },

        getArray: function(which) {
            return which === "all" ? allMPs : filteredMPs;
        },

        setArray: function(mps, which) {
            return which === "all" ? allMPs = mps : filteredMPs = mps;
        },
    };
})();

const CONTROLLER = (function() {

    /**
     * SORTS: MAKES THE TOP LIST
     * @param {array} mps - mp array of objects
     */
    function sortNumberOfSpeeches(mps) {
        return mps.sort((a, b) => a.numberofspeeches > b.numberofspeeches ? -1 : 1);
    }

    function launchPrintToplist(type) {
        let toPrint = MODEL.getArray(type);
        VIEW.printTopList(toPrint);
    }

    return {

        /**
         * first call picks upp mp-array and makes 300 ajax calls and creates
         * a live object.
         * second call is a dev bypass that cuts directly to sorting using 
         * a readymade array of objects.
         */

        initMPObject: function() {
            let mpObject = MODEL.makeMasterMPArr();
        },

        storeArray: function(mps, type) {
            MODEL.setArray(mps, type);
            launchPrintToplist(type);
        },

    };

})();


const VIEW = (function() {

    return {
        printTopList: function(mps) {
            let top = 10;
            var toplist = document.getElementById("toplist");
            toplist.innerHTML = "";
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
        `
            }
        },

        /**
         * EVENT LISTENERS
         */
        init: (function() {
            document.getElementById("getButton").addEventListener("click", CONTROLLER.initMPObject);
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