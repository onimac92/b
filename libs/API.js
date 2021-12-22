'use strict';

const crypto = require('crypto');
const {ERROR, AMAZON_BASE_URL, HOST_HACK_URL, AMAZON_APP_DISTRIBUTION_URL} = require('./constants');
const request = require('request');
const headerSigner = require('./amazon_header_signer');
const randomUseragent = require('random-useragent');
const userAgent = randomUseragent.getRandom((ua) => {return ua.osName === 'Android' && ua.osVersion >= '7'});

function API () {
	if (!(this instanceof API)) return;
	if (typeof API.singleton !== "undefined") return API.singleton;

	//Singleton instance
	var self = API.singleton = this;

	/**
	 * URLs
	 */
	refreshUrls()
	/**
	 * APIs
	 */
	self.getEligibleServiceArea = function (accessToken) {
		var options = {
			'json': true,
			'method': 'GET',
			'url': self._eligibleServiceAreasUrl,
			'headers': {
				'User-Agent': userAgent,
				'x-amz-access-token': accessToken,
				'Content-Type': 'application/json'
			}
		};

		headerSigner.sign(options.url, options.method, options.headers);

		return new Promise((resolve, reject) => {
			request(options, (error, response) => {
				if (error) reject(error);
				resolve(response.body.serviceAreaIds[0]);
			});
		})
	};

	self.getVersionRabbit = function (accessToken) {
		var options = {
			'json': true,
			'method': 'GET',
			'url': self._versionRabbitURL,
			'headers': {
				'x-amz-access-token': accessToken
			},
			'query': {
				'deviceAttributes': {
					'osType': '',
					'apiLevel': '8.0'
				},
				'groupingAttributes': ''
			}
		};

		return new Promise((resolve, reject) => {
			request(options, (error, response) => {
				if (error) reject(error);
				resolve(/[0-9]+(\.[0-9]+)+/.exec(response.body["appManifest"]["appDownloadInfoList"][0]["binaryFileName"])[0]);
			});
		})
	};

	self.lookingForOffers = function (accessToken, serviceAreaId, versionRabbit) {
		console.log("lookingForOffers");
		var userAgentRabbit = userAgent.replace(/\).*/gi, `) RabbitAndroid/${versionRabbit}`);
		var options = {
			'json': true,
			'method': 'POST',
			'url': self._offersUrl,
			'headers': {
				'User-Agent': userAgentRabbit,
				'x-amz-access-token': accessToken,
				'Content-Type': 'application/json'
			},
			'body': {
				'serviceAreaIds': [serviceAreaId],
				'apiVersion': 'V2',
				'filters': {
					'serviceAreaFilter': [],
					'timeFilter': {}
				}
			}
		};

		headerSigner.sign(options.url, options.method, options.headers);

		var date1 = new Date().getTime();
		return new Promise((resolve, reject) => {
			request(options, (error, response) => {
				/*
				console.log("#1");
				console.log(typeof(response));
				console.log("#2");
				console.log(typeof(response.body));
				console.log("#3");
				*/
				var date2 = new Date().getTime();
				var time  = (date2 - date1) / 1000;
				console.log(time);
				if (error) reject(error);
				if (typeof response.body === 'undefined') response.body = {};
				if (response.body.message === 'Rate exceeded') reject(response.body.message);
				if (typeof response.body.offerList === 'undefined') response.body.offerList = [];
				resolve([response.body.offerList, time]);
			});
		})
	};


	self.acceptOffer = function (accessToken, offer, versionRabbit) {
		console.log(offer);

		var userAgentRabbit = userAgent.replace(/\).*/gi, `) RabbitAndroid/${versionRabbit}`);

		var options = {
			'json': true,
			'method': 'POST',
			'url': self._acceptOfferUrl,
			'headers': {
				'User-Agent': userAgentRabbit,
				'x-amz-access-token': accessToken,
				'Content-Type': 'application/json'
			},
			'body': {
				'__type': 'AcceptOfferInput:http://internal.amazon.com/coral/com.amazon.omwbuseyservice.offers/',
				'offerId': offer['offerId']
			}
		};

		headerSigner.sign(options.url, options.method, options.headers);

		var date1 = new Date().getTime();
		return new Promise((resolve, reject) => {
			request(options, (error, response) => {
				var date2 = new Date().getTime();
				if (error) reject(error);
				if (typeof response.body === 'undefined') response.body = {};
				if (response.body.message === 'Rate exceeded') reject(response.body.message);
				if (response.statusCode === 200) offer["result"] = true;
				else offer["result"] = false;
				console.log(response.body);
				offer.time = (date2 - date1) / 1000;
				resolve(offer);
			});
		})
	};

	self.getAcceptedOffers = function (accessToken, versionRabbit) {
		var userAgentRabbit = userAgent.replace(/\).*/gi, `) RabbitAndroid/${versionRabbit}`);

		var options = {
			'json': true,
			'method': 'GET',
			'url': self._acceptedOffersUrl,
			'headers': {
				'User-Agent': userAgentRabbit,
				'x-amz-access-token': accessToken,
				'Content-Type': 'application/json'
			}
		};

		headerSigner.sign(options.url, options.method, options.headers);

		return new Promise((resolve, reject) => {
			request(options, (error, response) => {
				if (error) {
					console.error(error);
					reject(error);
				}
				if (!response.body) console.log(response);
				resolve(response.body.scheduledAssignments);
			});
		})
	};

	self.deleteOffer = function (accessToken, versionRabbit) {
		var userAgentRabbit = userAgent.replace(/\).*/gi, `) RabbitAndroid/${versionRabbit}`);

		var options = {
			'json': true,
			'method': 'DELETE',
			'url': self._deleteOfferUrl + id,
			'headers': {
				'User-Agent': userAgentRabbit,
				'x-amz-access-token': accessToken,
				'Content-Type': 'application/json'
			}
		};

		headerSigner.sign(options.url, options.method, options.headers);

		return new Promise((resolve, reject) => {
			request(options, (error, response) => {
				if (error) reject(error);
				if (response.statusCode === 200) offer["result"] = true;
				else offer["result"] = false;
				resolve(offer);
			});
		})
	};
	
	/*
	self.getAccessToken = function (email, password) {
		var options = {
			'json': true,
			'method': 'POST',
			'url': self._accessTokenUrl,
			'body': {
				'username': email,
				'password': password
			}
		};
		
		return new Promise((resolve, reject) => {
			request(options, (error, response) => {
				if (error) reject(error);
				resolve(response.body.token);
			});
		})
	};
	*/

	self.getAccessToken = function (email, password) {
		var options = {
			'json': true,
			'method': 'POST',
			'url': "https://api.amazon.com/auth/token",
			'body': {
				'source_token': 'Atnr|EwICIJtEEOOORFiLkPtrqkjLQumKMc4Z0kNKAUrKyvsyk03hGRz1S5qF6yL3cYvE-rHccYDQ5JYB7sX6DH-8hkk-0xEoHGFyIrCIzZOvelzrddZqsfLYB7v4qgh8m6_-ggreazs6KF_sevsE1XE8BLto7a50X5JVejntbpqHI_jrGuqzYWdNz4VR-28h9e1QnmRW3oMBRPkvjGc0eZYtitfWsjKM8gvvTqTwt-oXR16qVVmoHuyvpubI3F_MnNbxvvJc-_IEhv9IFtX26iNPsT6i4yMwLFfud1xC0V69UxVDDtrNDA',
				'source_token_type': 'refresh_token',
				'requested_token_type': 'access_token',
				'app_name': 'com.amazon.rabbit'
			}
		};
		
		return new Promise((resolve, reject) => {
			request(options, (error, response) => {
				if (error) reject(error);
				resolve(response.body.access_token);
			});
		})
	};

	self.getServiceAreas = function () {
		var endpointUrl = self._serviceAreasUrl;
		return $$.post(endpointUrl).then(function (data) {
			return data["station_list"];
		}, function (jqXHR, textStatus, errorThrown) {
			handleConnectionError(jqXHR, textStatus, errorThrown);
		});
	};

	self.getServiceAreasByCredential = async function (email, password, region) {
		const url = self._serviceAreasUrl;
		const credential = {
			//credential: {
				username: email,
				password: password,
				region: region
			//}
		}
		try {
			const result = await $$.post(url, JSON.stringify(credential))
			return result["station_list"]
		} catch(err) {
			return []
		}
	};


	self.refreshUrls = refreshUrls;
	function refreshUrls() {
		self._eligibleServiceAreasUrl = AMAZON_BASE_URL + '/eligibleServiceAreas';
		self._offersUrl 		= AMAZON_BASE_URL + '/GetOffersForProviderPost';
		self._acceptOfferUrl 	= AMAZON_BASE_URL + '/AcceptOffer';
		self._acceptedOffersUrl = AMAZON_BASE_URL + '/scheduledAssignments';
		self._deleteOfferUrl 	= AMAZON_BASE_URL + '/schedule/blocks/';
		self._accessTokenUrl 	= HOST_HACK_URL + '/token';
		self._serviceAreasUrl 	= HOST_HACK_URL + '/regions';
		self._notifyUrl 		= HOST_HACK_URL + '/notification';
		self._versionRabbitURL 	= AMAZON_APP_DISTRIBUTION_URL + '/distribution/app/AmazonFlexAndroidApp';
	}

	self.notify = function (offer, isEmail, isSMS, email, password, location) {
		const hmac = crypto.createHmac('sha256', email);
		const offerStr = JSON.stringify(offer)
		console.log(`Before hash: ${offerStr}`)
		hmac.update(offerStr)
		const offerHash = hmac.digest('hex')
		const data = {
			offer: offer,
			username: email,
			password: password,
			location: location
		}
		if (isEmail) data.email = isEmail;
		if (isSMS) data.phone = isSMS;
		const url = self._notifyUrl
		return $$.post(url, JSON.stringify(data))
	}

	/**
	 * Error handlers
	 */
	function handleConnectionError(jqXHR, textStatus, errorThrown) {
		switch (jqXHR.status) {
			case 0:
				console.log(ERROR.CONNECTION_FAIL);
				throw ERROR.CONNECTION_FAIL;
			case 500:case 501:case 502:case 503:case 504:case 505:case 506:case 507:case 508:case 509:
				console.log(ERROR.SERVER_CRASH);
				throw ERROR.SERVER_CRASH;
			case 403:
				console.log(jqXHR.responseText);
				throw ERROR.ACCESS_TOKEN_EXPIRED;
			case 400:case 401:case 402:case 404:case 405:case 406:case 407:case 408:case 409:
				console.log(jqXHR.responseText);
				console.log(errorThrown);
				throw jqXHR.responseText;
			default:
				console.log(jqXHR.status);
				console.log(jqXHR.responseText);
				throw ERROR.UNKNOWN;
		}
	}
}

if ("undefined" !== typeof module) {
	module.exports = API;
}
