process.env.TZ = "America/New_York";
const admin  = require("firebase-admin");
const moment = require("moment");
const client = require('twilio')('ACfd1b3d505456fea8248a28dc2ef40589', '6904807b5f6bd43d4d00453416622851');
const Bot    = require('./libs/bot');
const bot    = new Bot();

var i = 0;
var t = [0];

admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "berbot-16db2",
        "private_key_id": "8923adda71adaa566accdd104c08f6a2537e70d4",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9e8GShazv58hA\nF2o+LrNyeBKv4/+Yj35+zRDu1SZODkGxUB62/z4bgrbV29dM/F3/34nTffBGs9fp\nJlXjbYX6iVUmyfzhd3myUIyekQUuvqWH7f4NiczQR5aM0LT034w+GhOHWGnWcaD3\ntFzZhGL23/v5EO+xx8TiK+v9zdwwlxXg4KnO5Qlz1stVfWmKw9zDu3CN3zo9jFw3\nNRuFjB1DrhyaJGhcZ3MzoE9MO0qBzaFAF7R5NRra/2ZbUSiLvZaLPJtCECp5C4S6\npjo0sbQoFTXdYCRim3kA8CvFmJsOpShElHQJaKCLIRxZ+uIFpD2fDNWk+LXny7vI\nupF5A7GTAgMBAAECggEAD7AZXLo4kTxNdhD6ON/A9689TNbBqK3ouTLdPgjjvP6t\nLbMGd/w19i0iWh5zeupCFhc54ArDQ/dL3v/PiJ7ewtlv9WAv0bMEnmDQ46f6F96s\n8c4ghJpuHKhwrIPzF3sSr2mVSFVnnduWiiuirFeroej1ga+HSN7TTC56wW6z1knn\nVfDIzohf8fAiFFKW94kg3sq6BCv/fuMDOJrWpvZbN4rhnodREZMc5npglvRb8PXS\niQ7+WS989tIRZ2yPfvFJiHlX9gbtBCnvWO5oxVPyrwQCUDTmL4EdCJ3mRzXlFRNB\nDHdgchtAFpqRJC3JDD/PV2NIQ4VcA2W3qXHKwEC8MQKBgQD1IlPO55GMaUZOTWYa\neY9Uwnk839fRrpex9AvqYdyviwkh6iQlNpUguILLxK4/UsR0LNRxbatIqmPmfFCD\nGdE6WvtJubsWuLGOZBj+IrjXGE4zEhy2WxcY6cygNmYM39oth5VSjyX2vv5Dl6zE\nNcsDyB3WCKdFKf2BYt14fTnsNwKBgQDF4e4C2a62Zc6r0BqM9jauskxCpAarUush\nLLNGweFWOvOe/zg8sG22JRe1GaurKCifNbn+0GHOHiiOzdShgVyIRB+0pAhQFzZp\nUpmcJD6AQoK5v7G3/Sumr0xca83b49rTf1vwPuwH+d67ABFKWTJqeRweheDLw3rb\nmuuGiLFPhQKBgBCbesIRvjKdDz5O0BQLGELNyhjtsVlrUqujtQr0Bld+O+goTLqY\nsBG/bl0Pvh5cJSMZxmrI20nZAVukIHBBV4N0loGwK5SmfqD+9xKAl7U62FFtcLSK\nB06QyGQyS0ekAswC24L0X8YPunop1HKWkmJ3NE5D19E/vwT9BbQcB8iRAoGBAKMG\nzNkqUEdTPt7MN2OU4V4x5KQukJQLX03YjuaniqdJMDb423Mcg3bBvnNkb8s17aml\nUNP/B+URcaadKyXX9s0JGvnu/i5FwX0qIQXD0n5GzX6M0LTdbl4IJCgsZNBZO4pt\nbehTXo//qyFzH8uaCvAvURxQffBB33EXhB01dqclAoGBAIWnoF/C46+IvyQL+edG\nY8cYApWhNtSwWpT9yOYSEYj4/L+yZaq3k6vZT40fcsfJN+gHD/9XxO+hMmgwUPyT\nIiG2tDXmizJA73yCC74rKUwW1m2RaII7vd/aMpb5RxTlzA3m9rP/kYINBCHn2njD\nS4dBYHV2oOha3cbC5CVuDYxE\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-xd76w@berbot-16db2.iam.gserviceaccount.com",
        "client_id": "115520200847954192854",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xd76w%40berbot-16db2.iam.gserviceaccount.com"
    }),
    databaseURL: "https://berbot-16db2-default-rtdb.firebaseio.com"
});

var db 	    = admin.database();
var running = db.ref("running");
var start   = db.ref("start");
var log     = db.ref("log");
var ping    = db.ref("ping");
var timeout = db.ref("timeout");
var beginBot;
var endBot;

running.set(false);
start.set(false);
ping.set(i);
timeout.set(average(t));
log.remove();

start.on('value', (snapshot) => {
    if (snapshot.val() === true) bot.start2();
    else if (snapshot.val() === false) bot.stop2();
});

var stations = {
    "29571892-da88-4089-83f0-24135852c2e4": "Miami Edgewater (UFL2)",
    "5540b055-ee3c-4274-9997-de65191d6932": "Virginia Gardens (UFL6)"
};

bot.registerEvent('acceptOfferSuccess', async(offer) => {
    i++;
    ping.set(i);
    t.push(offer.time);
    timeout.set(average(t));
    var beginTime  = moment(offer.startTime * 1000);
    var endTime    = moment(offer.endTime * 1000);
    var beginHour  = beginTime.format("hh:mma");
    var endHour    = endTime.format("hh:mma");
    var dateOfWeek = convertDateToDateOfWeek(beginTime);
    var block      = dateOfWeek === 'Today' ? 'Accepted' : 'Reserved';
    var areaName   = stations[offer.serviceAreaId];
    var price      = offer.rateInfo.priceAmount + offer.rateInfo.currency;

    log.push(`${beginHour} - ${endHour} [${dateOfWeek}] [${areaName}] [${price}] - ${offer.time} ACCEPTED`);

    client.messages.create({
        body: `StarFlexBeta reports:\nBlock: ${block}\nLocation: ${areaName}\nDay: ${dateOfWeek}\nHour: ${beginHour} - ${endHour}\nPrice: ${price}\nTimeOut: ${offer.time}`,
        from: '+16504312412',
        to:   '+15037056825'
    }).then(message => {
        log.push(`Success SMS`);
    }).catch(error => {
        console.log(error)
        log.push(`Error SMS`);
    })

    bot.stop2();
})

bot.registerEvent('acceptOfferFailed', async(offer) => {
    i++;
    ping.set(i);
    t.push(offer.time);
    timeout.set(average(t));
    var beginTime  = moment(offer.startTime * 1000);
    var endTime    = moment(offer.endTime * 1000);
    var beginHour  = beginTime.format("hh:mma");
    var endHour    = endTime.format("hh:mma");
    var dateOfWeek = convertDateToDateOfWeek(beginTime);
    var areaName   = stations[offer.serviceAreaId];
    var price      = offer.rateInfo.priceAmount + offer.rateInfo.currency;

    log.push(`${beginHour} - ${endHour} [${dateOfWeek}] [${areaName}] [${price}] - ${offer.time} MISSED`);
})

bot.registerEvent('overRateDetected', async() => {
    log.push(`overRateDetected #${i}: ${moment(beginBot).format("hh:mm:ss")} - ${moment(endBot).format("hh:mm:ss")} | ${moment(new Date()).format("hh:mm:ss")}`);
})

bot.registerEvent('accessTokenRefreshed', async() => {
    log.push(`accessTokenRefreshed`);
})

/*
bot.registerEvent('filteredBlock', async(offer) => {
    console.log("filteredBlock")
})
*/

bot.registerEvent('requestBlock', async(offer, time) => {
    i++;
    ping.set(i);
    //t.push(time);
    //timeout.set(average(t));
})

bot.registerEvent('started', async() => {
    beginBot = new Date();
    running.set(true);
    log.push(`started: ${moment(beginBot).format("hh:mm:ss")}`);
})

bot.registerEvent('stopped', async() => {
    endBot = new Date();
    running.set(false);
    log.push(`stopped: ${moment(endBot).format("hh:mm:ss")}`);
})

function convertDateToDateOfWeek(date) {
    if (moment().isSame(date, "day")) return "Today";
    else if (moment().add(1, "days").isSame(date, "day")) return "Tomorrow";
    else return date.format("MMM DD");
}

function average(x) {
    return ((x.reduce((p, c) => p + c)) / x.length).toFixed(3);
}