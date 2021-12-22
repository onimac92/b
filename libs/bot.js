/**
 * This requires API.js first
 */
'use strict';

const API = require('./API');
const JobQueueManager = require('./JobQueueManager');
const TaskManager = require('./TaskManager');
const {ERROR} = require('./constants');
const moment = require('moment');

var SETTINGS = {
	hours: [/*"1"*/],
	stations: [
		{
			"id": "29571892-da88-4089-83f0-24135852c2e4",
			"name": "Miami Edgewater (UFL2)- Prime Now"
		},
		{
			"id": "5540b055-ee3c-4274-9997-de65191d6932",
			"name": "Virginia Gardens - (UFL6) Prime Now"
		}
	],
	duration: [120, 720],
	special_days: [/*"tomorrow", "today"*/],
	pauseTimeout: 5,
	account: {
		email: "bernardoconcepcion1097@gmail.com2",
		password: "Star1209"
	}
}

function Bot() {
	if (typeof Bot.singleton == "Bot") return Bot.singleton;

	var self = Bot.singleton = this;
	self._accessToken;
	self._eligibleServiceArea;
	self._events 				= {};
	self._isAccessTokenExpired 	= true;
	self._intervalTime 			= 650;//1000
	self._API 					= new API();
	self.jobQueueManager 		= new JobQueueManager()
	self._versionRabbit;

	/**
	 * APIs
	 */

	self.registerEvent = function (eventName, fn) {
		if (typeof self._events[eventName] === 'undefined') {
			self._events[eventName] = [];
			self._events[eventName].push(fn);
		} else self._events[eventName].push(fn);

		self._events[eventName] = self._events[eventName].filter(function (value, index, arr) {
			return arr.indexOf(value) === index;
		});
	};


	self.setAccessToken = function (accessToken) {
		var self = this;
		self._accessToken = accessToken;
	};


	/**
	 * Private function
	 */


	self.start2 = start2
	self.stop2 = stop2
	self.startBotWithDelay2 = startBotWithDelay2
	self.catchError2 = catchError2
	self.setSpeed2 = setSpeed2

	/**
	 * Private filters
	 */
	function filterOfferByStation(offer) {
		if (SETTINGS.stations.length == 0 || SETTINGS.stations.findIndex(e => e.id === offer.serviceAreaId) > -1) {
			return false;
		}
		return true;
	}

	function filterOfferByPreferedTime(offer) {
		var startTime = new Date(offer.startTime * 1000);
		var endTime = new Date(offer.endTime * 1000);
		if (SETTINGS.hours.length == 0 || _.indexOf(SETTINGS.hours, String(startTime.getHours())) > -1 && _.indexOf(SETTINGS.hours, String(endTime.getHours())) > -1) return false;

		return true;
	}

	function filterOfferByDuration(offer) {
		var startTime = moment.unix(offer.startTime);
		var endTime = moment.unix(offer.endTime);
		var durationFrom = moment.duration(SETTINGS.duration[0], "minutes");
		var durationTo = moment.duration(SETTINGS.duration[1], "minutes");

		if (startTime.add(durationFrom) <= endTime) {
			startTime = moment.unix(offer.startTime); //reset start time
			if (endTime <= startTime.add(durationTo)) return false;
		}

		return true;
	}

	function filterOfferBySpecialDays(offer) {
		var startTime = moment.unix(offer.startTime);

		if (SETTINGS.special_days.indexOf("today") > -1 && startTime.startOf("date").isSame(moment().startOf("date"))) {

			return true;
		}

		if (SETTINGS.special_days.indexOf("tomorrow") > -1 && startTime.startOf("date").isSame(moment().add(1, "days").startOf("date"))) {

			return true;
		}

		if (SETTINGS.special_days.indexOf(startTime.format("ddd").toLowerCase()) > -1) {

			return true;
		}

		if (SETTINGS.special_days.indexOf(startTime.format("YYYY-MM-DD")) > -1) {

			return true;
		}

		return false;
	}

	async function workflow2() {
		const self = this
		try {
			var d1 = new Date().getTime();
			const offers = await this._API.lookingForOffers(self._accessToken, self._eligibleServiceArea, self._versionRabbit)
			var d2 = new Date().getTime();
			populateEvent ("requestBlock", offers, offers[1]);

			/*
			const filteredOffers = offers[0].filter((offer) => {
				if (filterOfferByStation(offer)
					|| filterOfferByPreferedTime(offer)
					|| filterOfferByDuration(offer)
					|| filterOfferBySpecialDays(offer)) {
					populateEvent ("filteredBlock", offer)
					return false
				} else {
					return true
				}
			})
			if (filteredOffers.length > 0) {
				//Pause 3s for accepting offers
				TaskManager.after(3 * 1000).every(this._intervalTime).schedule('search-for-blocks', workflow2.bind(this))
			}
			
			filteredOffers.forEach((offer) => {
				//Avoid use async await to tweak performance
				var d3 = new Date().getTime();
				self._API.acceptOffer(self._accessToken, offer, self._versionRabbit).then(({ result }) => {
					var d4 = new Date().getTime();
					console.log("lookingForO          " + (d2 - d1) / 1000);
					console.log("acceptOffer          " + (d4 - d3) / 1000);
					console.log("afterLook - befoAcce " + (d3 - d2) / 1000);
					console.log("todo                 " + (d4 - d1) / 1000);
					if (result) {
						populateEvent("acceptOfferSuccess", offer)
					} else {
						populateEvent("acceptOfferFailed", offer)
					}
				}, (err) => {
					self.catchError2(err)
				})
			})
			*/
		} catch (err) {
			switch (err) {
				case 'Rate exceeded':
					populateEvent('overRateDetected');
					self.stop2();
					//TaskManager.after(SETTINGS.pauseTimeout * 60 * 1000).every(this._intervalTime).schedule('search-for-blocks', workflow2.bind(this))
					break
				default:
					self.catchError2(err)
					self.stop2()
					break
			}
		}
	}

	async function start2 (delay=0) {
		if (TaskManager.isExists('search-for-blocks')) {
			return
		}
		TaskManager.every(45*60*1000).immediately().schedule('refresh-access-token', async (bot) => {
			try {
				const accessToken = await bot._API.getAccessToken(SETTINGS.account.email, SETTINGS.account.password)
				bot.setAccessToken(accessToken)
				populateEvent("accessTokenRefreshed", accessToken)
				bot._eligibleServiceArea = await bot._API.getEligibleServiceArea(accessToken)
				bot._versionRabbit = await bot._API.getVersionRabbit(accessToken)
				if (!TaskManager.isExists('search-for-blocks')) {
					TaskManager.after(delay).every(bot._intervalTime).schedule('search-for-blocks', workflow2.bind(bot))
				}
			} catch (err) {
				bot.catchError2(err)
				bot.stop2()
			}
		}, [this])

		populateEvent('started')
	}

	async function startBotWithDelay2(delay=0) {
		TaskManager.after(delay).schedule('start-bot-with-delay', start2.bind(this))
	}

	async function setSpeed2(speed) {
		switch (speed) {
			case "safe":
				self._intervalTime = 1000;
				break;
			case "normal" :
				self._intervalTime = 650;
				break;
			case "high" :
				self._intervalTime = 350;
				break;
			default :
				if (typeof level == "number")
					self._intervalTime = speed;
				else
					self._intervalTime = 1000;
		}
		if (TaskManager.isExists('search-for-blocks')) {
			TaskManager.every(bot._intervalTime).schedule('search-for-blocks', workflow2.bind(this))
		}
	}

	async function catchError2(error) {
		switch (error) {
			case ERROR.LICENSE_EXPIRED:
				populateEvent("licenseExpired");
				break;

			case ERROR.ACCESS_TOKEN_EXPIRED:
				self._isAccessTokenExpired = true;
				populateEvent("accessTokenExpired");
				break;

			case ERROR.LOGIN_FAILED:
				populateEvent("unableToGetAccessToken", "username or password wrong");
				break;

			case ERROR.USER_BANNED:
				populateEvent("unableToGetAccessToken", "user banned");
				break;

			case ERROR.TOO_MANY_PEOPLE:
				populateEvent("unableToGetAccessToken", "too many people in your area using ZeroFlex");
				break;

			case ERROR.NO_AREA_ID:
				populateEvent("badToken", "not found your area id, please check your username and password");
				break;

			case ERROR.IN_WAITING_LIST:
				populateEvent("inWaitingList");
				break;

			case ERROR.BAD_TOKEN:
				populateEvent("badToken", "bad token");
				break;

			default:
				console.log("errorito");
				console.log(error);
				if (typeof error === "object" && error["type"]===ERROR.BAD_TOKEN) {
					populateEvent("badToken", error["description"])
				}
				else if (typeof error === "object" && error["type"]===ERROR.BAD_TOKEN_SERVER_SIDE) {
						populateEvent("badTokenServerSide", error["description"])
				}
				else if (typeof error === "object" && error["type"]===ERROR.BAD_REFRESH_TOKEN) {
						populateEvent("badRefreshToken")
				}
				else
					populateEvent("unknown", error);
				break;
		}
	}

	async function stop2 () {
		if (TaskManager.isExists('search-for-blocks') || TaskManager.isExists('refresh-access-token')) {
			TaskManager.clear('search-for-blocks')
			TaskManager.clear('refresh-access-token')
			populateEvent('stopped')
		}
	}

	function populateEvent(eventName) {
		var args = Array.prototype.slice.call(arguments);
		if (self._events[eventName] instanceof Array) {
			args.shift(1);
			for (var i = 0; i < self._events[eventName].length; i++) {
				let fn = self._events[eventName][i];
				if (fn instanceof Function)
					setTimeout(function (fn) {
						fn.apply(self, args);
					}, 250, fn);
			}
		}
	}
}
if ("undefined" !== typeof module) {
	module.exports = Bot;
}
