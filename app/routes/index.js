const isLoggedIn = require('../utils/isLoggedIn'),
	getNewAccessToken = process.env.NODE_ENV == 'test' ? null : require('./auth').getNewAccessToken,
	express = require('express'),
	request = require('request');

const router = express.Router();

router.get('/', (req, res) => {
	const INSTANCE = process.env.INSTANCE || 'node';
	res.render('index', {
		title: 'Daily Trip Enhancer',
		instance: INSTANCE,
		user: req.user
	});
});

router.get('/refresh_token', isLoggedIn, function (req, res) {
	getNewAccessToken(req.user, function () {
		res.redirect('/');
	});

});

router.get('/test', function (req, res) {
	res.status(200).json('Funziona');
});


router.get('/account', isLoggedIn, function (req, res) {
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



/* ------------------------ CALCOLO DELLE COORDINATE --------------*/
/* CAP --> Coordinate */

router.post('/getCoordinates', function (req1, res1) {
	let partenza = req1.body.partenza;
	let destinazione = req1.body.destinazione;
	let mezzo_trasporto = req1.body.mezzo;

	request.get('/' + durata_viaggio + '/:cap_partenza/:cap_destinazione', function (req2, res2) {
	});
});



module.exports = router;