(function() {
    document.addEventListener("DOMContentLoaded", start);
    document.getElementById("getButton").addEventListener("click", fetchAllMPs);

})();

function start() {

}

//fetched from: http://data.riksdagen.se/personlista/?iid=&fnamn=&enamn=&f_ar=&kn=&parti=&valkrets=&rdlstatus=&org=&utformat=json&termlista=
function fetchAllMPs() {
    fetch("mps.json")
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
            party: "(" + personlista[i].parti + ")"
        });
    }
    fetchDebates(allMPs);
}

function fetchDebates(allMPs) {
    let fromDate = oneMonthBack();
    for (let i = 0; i < allMPs.length; i++) {
        fetch(`http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=Nej&d=${fromDate}&ts=&parti=&iid=${allMPs[i].id}&sz=200&utformat=json`)
            .then(response => response.json())
            .then(data => addSpeechToObj(data, i));
    }
    console.log(allMPs);
}

function addSpeechToObj(data, index) {
    allMPs[index].numberofspeeches = data.anforandelista["@antal"];
    if (data.anforandelista["@antal"] !== "0") {
        allMPs[index].speeches = data.anforandelista.anforande;
    }
}

function oneMonthBack() {
    let date = new Date();
    return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
}



//making allmp:s an object literal of objects
// function makeMyMPObjects(MPs) {
//     let personlista = MPs.personlista.person;
//     let allMPs = {}
//     console.log(personlista);
//     for (let i in personlista) {
//         allMPs[personlista[i].intressent_id] = {
//             id: personlista[i].intressent_id,
//             fornamn: personlista[i].tilltalsnamn,
//             efternamn: personlista[i].efternamn,
//             parti: personlista[i].parti
//         };
//     }
//     console.log(allMPs);
// }

/* function callRiksdagen() {
    fetch("http://data.riksdagen.se/anforandelista/?rm=2016%2F17&anftyp=Nej&d=2017-01-01&ts=&parti=&iid=0273506284025&sz=2000&utformat=json")
        .then(response => response.json())
        .then(data => display(data));
}

function display(data) {
    console.log(data);
    let number = data.anforandelista["@antal"];
    let name = data.anforandelista.anforande[0].talare;
    document.getElementById("displayP").innerText = `${name}: ${number}`;

}*/