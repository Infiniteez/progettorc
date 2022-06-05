
const ensureAuthenticated = require('./auth').ensureAuthenticated,
	getNewAccessToken = require('./auth').getNewAccessToken,
	express = require('express'),
	request = require('request');

const router = express.Router();

router.get('/', (req, res) => {
	const NODE = process.env.NODE_ENV || 'dev-local';
	const INSTANCE = process.env.INSTANCE || 'node';
	res.render('index', {
		title: 'Docker with Nginx and Express',
		node: NODE,
		instance: INSTANCE,
		user: req.user
	});
});

router.get('/refresh_token', ensureAuthenticated, function (req, res) {
	getNewAccessToken(req.user, function () {
		res.redirect('/');
	});

});

/* account */
router.get('/account', ensureAuthenticated, function (req, res) {
	make_get_request(
		'https://api.spotify.com/v1/me/top/artists?' +
		new URLSearchParams({
			limit: 3
		}).toString(),
		req.user,
		function ok(body) {
			let seed = '', names = '';
			for (const artist of body.items) {
				seed += artist.id + ',';
				names += artist.name + ',';
			}
			seed = seed.slice(0, -1);
			names = names.slice(0, -1);

			make_get_request(
				'https://api.spotify.com/v1/recommendations?'
				+ new URLSearchParams({
					seed_artists: seed,
					limit: 100
				}).toString(),
				req.user,
				function ok(body) {
					res.render('account', { // invio al browser solo quello che serve
						names: names,
						tracks: body.tracks.map(function (track) {
							return { name: track.name, preview_url: track.preview_url };
						})
					});
				}
			);
		}, function ko() {
			res.redirect('/');
		}
	);


});

function make_get_request(url, user, ok, ko) {

	let options = {
		url: url,
		headers: { 'Authorization': 'Bearer ' + user.access_token },
		json: true
	};

	request.get(options, function (error, response, body) {
		if (!error && response.statusCode === 200) { // token ancora valido
			ok(body);
		}
		else if (!error && response.statusCode === 401) { // token scaduto
			getNewAccessToken(user, function () {
				options.headers.Authorization = 'Bearer ' + user.access_token; // aggiorno il token
				request.get(options, function (error, response, body) { // riprovo la richiesta
					if (!error && response.statusCode === 200) {
						ok(body);
					}
				});
			});
		}
		else {
			console.log('error: ' + response.statusCode);
			ko();
		}
	});
}

/*
function msToHHMMSS(ms) {
	// 1- Convert to seconds:
	var seconds = ms / 1000;

	// 2- Extract hours:
	var hours = parseInt(seconds / 3600); // 3600 seconds in 1 hour
	seconds = parseInt(seconds % 3600); // extract the remaining seconds after extracting hours

	// 3- Extract minutes:
	var minutes = parseInt(seconds / 60); // 60 seconds in 1 minute

	// 4- Keep only seconds not extracted to minutes:
	seconds = parseInt(seconds % 60);

	// 5 - Format so it shows a leading zero if needed
	let hoursStr = ('00' + hours).slice(-2);
	let minutesStr = ('00' + minutes).slice(-2);
	let secondsStr = ('00' + seconds).slice(-2);

	return hoursStr + ':' + minutesStr + ':' + secondsStr;
}
*/


/* ------------------------ CALCOLO DELLE COORDINATE --------------*/
/* CAP --> Coordinate */

router.post('/getCoordinates', function (req, res) {
	let partenza = req.body.partenza;
	let destinazione = req.body.destinazione;

	let options1 = { // richiesta coordinate partenza
		url: 'http://api.zippopotam.us/it/' + partenza,
		json: true
	};
	let options2 = { // richiesta coordinate destinazione
		url: 'http://api.zippopotam.us/it/' + destinazione,
		json: true
	};

	request.get(options1, function (error1, response1) {
		if (!error1 && response1.statusCode === 200) { // richiesta andata a buon fine
			console.log(response1);
			let long1 = response1.body.places[0].longitude;
			let lat1 = response1.body.places[0].latitude;

			// richiesta coordinate di destinazione
			request.get(options2, function (error2, response2) {
				if (!error2 && response2.statusCode === 200) { // richiesta andata a buon fine
					console.log(response2);
					let long2 = response2.body.places[0].longitude;
					let lat2 = response2.body.places[0].latitude;

					res.render('coordinates', { // invio al browser la risposta
						long1: long1,
						lat1: lat1,
						long2: long2,
						lat2: lat2
					});
				}
				else {
					res.render('index');
				}
			});
		}
		else {
			res.render('index');
		}
	});
});



module.exports = router;