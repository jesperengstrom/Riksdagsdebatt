(function() {
    document.addEventListener("DOMContentLoaded", start);
    document.getElementById("getButton").addEventListener("click", fetchAllMPs);

})();

function start() {

}

//fetched from: http://data.riksdagen.se/personlista/?iid=&fnamn=&enamn=&f_ar=&kn=&parti=&valkrets=&rdlstatus=&org=&utformat=json&termlista=
function fetchAllMPs() {
    fetch("json/rawMPs.json")
        .then(response => response.json())
        .then(data => makeMyMPObjects(data));
}

//making allmp:s an array of objects. MUST NOT BE GLOBAL
let allMPs = [];

function makeMyMPObjects(MPs) {
    let personlista = MPs.personlista.person;
    for (let i in personlista) {
        allMPs.push({
            id: personlista[i].intressent_id,
            firstname: personlista[i].tilltalsnamn,
            lastname: personlista[i].efternamn,
            party: "(" + personlista[i].parti + ")",
            image: personlista[i].bild_url_192
        });
    }
    fetchDebates(allMPs);
}

function fetchDebates(allMPs) {
    var fetchObj;
    let fromDate = oneMonthBack();
    let countComebacks = "Nej";
    for (let i = 0; i < allMPs.length; i++) {
        fetchObj = fetch(`http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=${countComebacks}&d=${fromDate}&ts=&parti=&iid=${allMPs[i].id}&sz=200&utformat=json`)
            .then(response => response.json())
            .then(data => addSpeechToObj(data, i));
    }
    console.log(allMPs);

    fetchObj.then(function() {
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
    const sortedMPs = mps.sort((a, b) => a.numberofspeeches > b.numberofspeeches ? -1 : 1);
    console.log(sortedMPs);
    printTopList(sortedMPs);
}

function printTopList(mps) {
    let top = 10;
    var toplist = document.getElementById("toplist");
    for (let i = 0; i <= top; i++) {
        toplist.innerHTML += `
        <tr data-id="${mps[i].id}">
            <td>${i + 1}</td>
            <td>
                <div class="mp-img-container">
                    <img src="${mps[i].image}" class="mp-img" alt="${mps[i].firstname} ${mps[i].lastname}">
                </div>
            </td>
            <td>${mps[i].firstname} ${mps[i].lastname} ${mps[i].party}</td>
            <td>${mps[i].numberofspeeches} anföranden</td>
        </tr>
        `

    }

}


/**
 * REVERTS CURRENT DATE ONE MONTH. NEEDS REMAKE (DEC BECOMES -1 INST OF 12)
 */
function oneMonthBack() {
    let date = new Date();
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