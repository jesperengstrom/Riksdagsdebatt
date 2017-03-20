const MODEL = (function() {
    var allMPs = [];

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

    /**
     * REVERTS CURRENT DATE ONE MONTH. NEEDS REMAKE (DEC BECOMES -1 INST OF 12)
     */
    function oneMonthBack() {
        let date = new Date();
        return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    }

    return {
        fetchDebates: function(allMPs) {
            var fetchObj;
            let fromDate = oneMonthBack();
            let countComebacks = "Ja";
            for (let i = 0; i < allMPs.length; i++) {
                fetchObj = fetch(`http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=${countComebacks}&d=${fromDate}&ts=&parti=&iid=${allMPs[i].id}&sz=200&utformat=json`)
                    .then(response => response.json())
                    .then(data => addSpeechToObj(data, i));
            }
            console.log(allMPs);

            fetchObj.then(function() {
                sortNumberOfSpeeches(allMPs);
            });
        },

        addSpeechToObj: function(data, index) {
            allMPs[index].numberofspeeches = parseInt(data.anforandelista["@antal"]);
            if (data.anforandelista["@antal"] !== "0") {
                allMPs[index].speeches = data.anforandelista.anforande;
            }
        },

        /**
         * Function in charge of returning my master array of MP-objects inc. all necessary info using several helper methods.
         * This is created on page load and then stored + printed. 
         */
        makeMasterMPArr: function() {
            let mps = fetchAllMPs().then(data => {
                let newArr = slimArray(data);
                console.log(newArr);

            });



        },

        getMPs: function() {
            return allMPs;
        },

        setMPs: function(mps) {
            allMPs = mps;

        }
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

    return {
        /**
         * first call picks upp mp-array and makes 300 ajax calls and creates
         * a live object.
         * second call is a dev bypass that cuts directly to sorting using 
         * a readymade array of objects.
         */
        initMPObject: function() {
            MODEL.makeMasterMPArr();

            //let sortedMPs = sortNumberOfSpeeches(testMPs);
            //MODEL.setMPs(sortedMPs);
            //CONTROLLER.readyToPrintToplist(sortedMPs);
        },
        readyToPrintToplist: function(mps) {
            VIEW.printTopList(mps);
        }
    };

})();


const VIEW = (function() {

    return {
        printTopList: function(mps) {
            console.log(mps);
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