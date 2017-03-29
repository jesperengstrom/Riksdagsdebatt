#Talartoppen#
###Uppgift i Ajax, JSON och Fetch###

**Jesper Engström, FEND16, Nackademin kurs JavaScript 2**

##Projektlänkar##
https://jesperengstrom.github.io/Talartoppen/
https://github.com/jesperengstrom/Talartoppen

##Beskrivning av applikationen##
Talartoppen är en sida som rankar de ledamöter som debatterar mest i riksdagen. Appen söker igenom Riksdagens anförandelistor (protokollen som loggar allt som händer i kammaren) och skapar en topplista utifrån sökträffarna.

Syftet är att skaffa sig någon slags koll på vilka politiker och partier som är mest aktiva, en tänkbar hjälp när det är dags att personrösta nästa år. Jag har skrivit mer utförligt om hur uträkningen fungerar och hur datan kan tolkas under "om"-sektionen på sidan.

##Funktionalitet##
* Topplista över riksdagsledamöterna som debatterar mest
* Möjlighet att filtrera sökningen på parti(er)
* Möjlighet att klicka på en enskild ledamot för att få upp de 10 senaste debatterna denne deltagit i (med symboler som visar mängden av aktivitet i just den debatten)
* Möjlighet att klicka på debattrubriker och symbolerna för att få fram vad ledamoten sade, samt en länk till hela debatten.
* Graf som visar vilka partier som debatterar mest i förhållande till antalet ledamöter.
* Graf som visar på skillnaden i hur mycket män/kvinnor talar.

##Teknologier##
* VS Code med diverse plugins (JSHint mm)
* NPM: Gulp, Babel, SASS, Post-CSS, Browser Sync, Autoprefixer 
* Bootstrap 4
* JQuery (krävs av Bootstrap)
* Chartist (JS-bibliotek för att göra grafer)
* Emoji-CSS (css-bibliotek)

##API##
https://data.riksdagen.se/
Riksdagen Öppna data innehåller ledamöter, voteringar, dokument och anföranden mm som kommer från Riksdagen.
Jag har enbart hämtat ledamöter och anföranden.

##Arbetsprocess##
####Förberedelse####
Veckan då uppgiften delades ut gick i princip åt till att tänka ut vilket projekt jag skulle göra.
Jag påbörjade ett par andra grejer som antingen kändes för trista eller hade API:er som var omöjliga att handskas med.
Jag visste att jag ville skapa en app som presententerade mycket data på ett nytt sätt, alltså något som man inte enkelt kunde googla sig till. Jag kom på att statliga myndigheter då är perfekt: Deras uppdrag är att vara så tillgängliga som möjligt gentemot medborgarna, därför ligger datan ofta öppet utan restriktioner. Ändå känns de inte särskilt utnyttjade.

####Produktion####
Eftersom så mycket tid hade gått ville jag veta om min idén ens gick att genomföra innan jag tänkte för mycket på utseendet. Jag ville undvika att göra en detaljerad mockup helt i onödan. Därför började jag koda direkt, så som man inte ska göra, och utseendet växte fram utifrån den funktionalitet som jag hann implementera.

Från förra uppgiften visste jag att jag ville använda mig av ett **modul-designmönster**. Denna gång var jag sugen på att prova en **MVC-approach** ovanpå det. I min primitiva tolkning blev det tre stora moduler som skötte olika delar av appen utifrån regler jag satte upp (och som jag nästan inte bröt emot):

* **MODEL**: Hämtar och lagrar, och manipulerar data - t.ex skapar nya objekt från gamla. Det mesta av appens logik.
* **VIEW**: Sköter UI:t - skriver ut information från controllern på skärmen, samt tar hand om user input och skickar till controllern.
* **CONTROLLER**: Sköter kommunikationen mellan model och view. "dirigerar" hela appen och skickar saker rätt beroende på ett särskilt tillstånd t.ex.

####Problem####
MVC-approachen visade sig vara både bra och dålig. Till en början var det oklart var Controllern skulle vara bra för, ofta kändes den som ett onödigt extra steg mellan model och view. Men allt eftersom projektet blev mer komplext blev det nödvändigt med en "hub" eller "gatekeeper" som datan passerade igenom. Jag tror att det minskade risken för fel drastiskt.

MVC:n gjorde det enklare att skaffa sig en mental bild av appen som en maskin, vad som hörde var. Däremot blev det efterhand lite väl stora kategorier för att jag snabbt skulle kunna navigera. Jag skulle egentligen ha behövt ytterligare namespaces inuti mina moduler.

Annars var utmaningen att förstå hur promises fungerade med `fetch`, kämpa mot eviga `undefined`samt att förhindra hur misslyckade ajax-anrop pajade koden längre fram.

##Förbättringar##
Jag tampades hela tiden med känslan att jag skrev för "basic" kod med för stora och orena funktioner. Samt att jag var dålig på att utnyttja protptyper, `this`, `bind` mm på ett smart sätt: att ha funktionerna tillgängliga för objekten direkt och slippa srtändigt skicka runt dem som argument.

_Den stora förbättringen_ som också är en todo är att sätta upp en egen server som hämtar anförandelistor automatiskt för varje ledamot, så att jag slipper göra 300+ ajax-anrop för varje besök. Working on it...

###Funktionell Todo###
* Snyggare transitions mellan de olika skärmarna
* En bottenlista - ledamöterna som talar minst
* Möjlighet för användaren att ställa in tidsramen för sökningen.
