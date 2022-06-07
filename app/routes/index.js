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

// --------------------- API --------------------- //
/**
 * @api {get} /info_viaggio/:mezzo_trasporto/:cap_partenza/:cap_destinazione Durata stimata viaggio
 * @apiDescription Restituisce la durata stimata del viaggio tra cap_partenza e cap_destinazione con mezzo_trasporto
 * @apiParam mezzo_trasporto Mezzo di trasporto, può essere scelto fra:
 * @apiParam cap_partenza CAP di partenza
 * @apiParam cap_destinazione CAP di destinazione
 */

router.get('/info_viaggio/:mezzo_trasporto/:cap_partenza/:cap_destinazione', function (req, res) {
	let mezzo_trasporto = req.params.mezzo_trasporto;
	let cap_partenza = req.params.cap_partenza;
	let cap_destinazione = req.params.cap_destinazione;

	let options1 = { // richiesta coordinate partenza
		url: 'http://api.zippopotam.us/it/' + cap_partenza,
		json: true
	};
	let options2 = { // richiesta coordinate destinazione
		url: 'http://api.zippopotam.us/it/' + cap_destinazione,
		json: true
	};

	request.get(options1, function (error1, response1) {
		if (!error1 && response1.statusCode === 200) { // richiesta andata a buon fine
			let long_start = response1.body.places[0].longitude;
			let lat_start = response1.body.places[0].latitude;

			// richiesta coordinate di destinazione
			request.get(options2, function (error2, response2) {
				if (!error2 && response2.statusCode === 200) { // richiesta andata a buon fine
					let long_end = response2.body.places[0].longitude;
					let lat_end = response2.body.places[0].latitude;

					var coordinates = {
						long_start: long_start,
						lat_start: lat_start,
						long_end: long_end,
						lat_end: lat_end
					};

					console.log(coordinates.lat_end);
					console.log(coordinates.long_start);

					let options3 = { //
						url: 'https://api.openrouteservice.org/v2/directions/' + mezzo_trasporto,
						json: true,
						headers: { 'Authorization': process.env.API_KEY_ORS },
						body: {
							'coordinates':
								[
									[coordinates.long_start, coordinates.lat_start],
									[coordinates.long_end, coordinates.lat_end]
								]
						}
					};

					request.post(options3, function (error3, response3) {
						if (!error3 && response3.statusCode === 200) { // chiamata andata a buon fine
							let distance = Number.parseFloat(response3.body.routes[0].summary.distance); // distanza in metri
							let duration = Number.parseFloat(response3.body.routes[0].summary.duration); // durata in secondi
							if (duration) {
								// risposta finale
								res.json({
									durata_hhmmss: msToHHMMSS(duration * 1000).toString(),
									durata_ms: duration.toString(),
									distanza: distance.toString(),
									mezzo_trasporto: mezzo_trasporto,
									cap_partenza: cap_partenza,
									cap_destinazione: cap_destinazione,
								});
							}
							else {
								res.json({
									errore: 'Impossibile trovare un percorso compatibile con i parametri specificati, prova un CAP di partenza/destinazione limitrofo'
								});
							}
						}
						else if (!error3 && response2.statusCode === 404) {
							res.json({
								errore: 'Impossibile trovare un percorso compatibile con i parametri specificati',
								dettaglio_errore: response3.body ? response3.body.error : null
							});
						}
						else {
							res.json({
								errore: 'Errore inaspettato nella ricerca di un percorso',
								dettaglio_errore: response3.body ? response3.body.error : null
							});
						}
					});
				}
				else if (!error2 && response2.statusCode === 404) {
					res.json({
						errore: 'Il CAP di destinazione non è valido'
					});
				}
				else {
					res.json({
						errore: 'Errore inaspettato nell\'elaborazione del CAP di arrivo'
					});
				}
			});
		}
		else if (!error1 && response1.statusCode === 404) {
			res.json({
				errore: 'Il CAP di partenza non è valido'
			});
		}
		else {
			res.json({
				errore: 'Errore inaspettato nell\'elaborazione del CAP di partenza'
			});
		}
	});
});



/**
 * @api {get} /distanza/:cap_partenza/:cap_destinazione Distanza fra due CAP
 * @apiDescription Restituisce la distanza in linea d'aria stimata tra cap_partenza e cap_destinazione
 * @apiParam cap_partenza CAP di partenza
 * @apiParam cap_destinazione CAP di destinazione
 */
router.get('/distanza/:cap_partenza/:cap_destinazione', function (req, res) {
	let cap_partenza = req.params.cap_partenza;
	let cap_destinazione = req.params.cap_destinazione;
	//TODO
	let distanza_m = 10000;
	res.json({ error: null, cap_partenza: cap_partenza, cap_destinazione: cap_destinazione, distanza_m: distanza_m });
});



// --------------------- AUSILIARIE --------------------- //
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


module.exports = router;