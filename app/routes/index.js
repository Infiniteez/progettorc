
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
		user: req.user ? req.user : null
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

module.exports = router;