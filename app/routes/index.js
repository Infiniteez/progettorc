const isLoggedIn = require('../utils/isLoggedIn'),
	getNewAccessToken = process.env.NODE_ENV == 'test' ? null : require('./auth').getNewAccessToken,
	express = require('express'),
	request = require('request'),
	msToHHMMSS = require('./api').msToHHMMSS;
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

router.get('/chat', function (req, res) {
	res.render('chat');
});

const BASE = 'http://localhost:' + process.env.PORT;

router.post('/mainFunc', isLoggedIn, function (req, res) {
	let partenza = req.body.partenza;
	let destinazione = req.body.destinazione;
	let mezzo_trasporto = req.body.mezzo;
	request.get({
		url: BASE + '/api/durata/' + mezzo_trasporto + '/' + partenza + '/' + destinazione,
		json: true
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			let target_duration = body.durata_s * 1000;
			console.log(target_duration);
			let array = new Array();
			let current_duration = 0;
			make_get_request(
				'https://api.spotify.com/v1/me/top/artists?limit=3',
				req.user,
				function (body) {
					let seed = '';
					for (const artist of body.items) {
						seed += artist.id + ',';
					}

					seed = seed.slice(0, -1);

					make_get_request(
						'https://api.spotify.com/v1/recommendations?'
						+ new URLSearchParams({
							seed_artists: seed,
							limit: 100
						}).toString(),
						req.user,
						function (body) {
							let processed = 0;
							array.push(body.tracks.map(function (track) {

								if (current_duration > target_duration || processed == body.tracks.length)
									return;
								processed++;
								current_duration += track.duration_ms;
								return { uri: track.uri, duration: track.duration_ms };
							}));
							array = array[0].slice(0, processed);
							array = array.map(function (track) {
								return track.uri;
							});
							// ora array contiene la lista dei soli uri
							console.log(array);
							console.log(array.length);
							console.log(current_duration);
							console.log(target_duration);
							console.log(msToHHMMSS(current_duration));
							console.log(msToHHMMSS(target_duration));

							// crea una playlist vuota
							make_post_request(
								'https://api.spotify.com/v1/users/' + req.user.spotify_id + '/playlists',
								{
									name: 'Viaggio da ' + partenza + ' a ' + destinazione,
									public: false
								},
								req.user,
								function (body2) {
									let playlist_id = body2.id;
									console.log(body2.id);
									setTimeout(() => { // aspetta 2 secondi, altrimenti non trova la playlist appena creata e dà 404
										make_post_request(
											'https://api.spotify.com/v1/playlists/' + playlist_id + '/tracks',
											{ uris: array },
											req.user,
											function () {
												res.render('done', {
													target_duration: msToHHMMSS(target_duration),
													current_duration: msToHHMMSS(current_duration),
													partenza: partenza,
													destinazione: destinazione,
													spotify_id: req.user.spotify_id,
													mezzo_trasporto: mezzo_trasporto,
													playlist_id: playlist_id
												});
											}
										);
									}, 2000);
								}
							);
						}
					);
				}
			);
		}
	});
});


function make_get_request(url, user, ok) {

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
		}
	});
}

function make_post_request(url, body, user, ok) {

	let options = {
		url: url,
		headers: { 'Authorization': 'Bearer ' + user.access_token },
		json: true,
		body: body
	};

	request.post(options, function (error, response, body) {
		if (!error && response.statusCode === 201) { // token ancora valido
			ok(body);
		}
		else if (!error && response.statusCode === 401) { // token scaduto
			getNewAccessToken(user, function () {
				options.headers.Authorization = 'Bearer ' + user.access_token; // aggiorno il token
				request.post(options, function (error, response, body) { // riprovo la richiesta
					if (!error && response.statusCode === 201) {
						ok(body);
					}
				});
			});
		}
		else {
			console.log('error: ' + response.statusCode);
		}
	});
}





module.exports = router;