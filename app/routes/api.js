const express = require('express');
const request = require('request');

const router = express.Router();


// --------------------- TEST ENDPOINT --------------------- //
router.get('/', function (req, res) {
	res.status(200).json(JSON.stringify({ api_working: true }));
});

// --------------------- API --------------------- //
/**
 * @api {get} /durata/:mezzo_trasporto/:cap_partenza/:cap_destinazione Durata stimata viaggio
 * @apiGroup Viaggio
 * @apiDescription Restituisce la durata stimata del viaggio tra cap_partenza e cap_destinazione con mezzo_trasporto
 * @apiParam mezzo_trasporto Mezzo di trasporto, può essere scelto fra: TODO
 * @apiParam cap_partenza CAP di partenza
 * @apiParam cap_destinazione CAP di destinazione
 * @apiParamExample {json} Esempio-Richiesta:
 *     {
 *         "mezzo_trasporto": "driving-car",
 *         "cap_partenza": "00020",
 *         "cap_destinazione": "00183"
 *     }
 * @apiSuccess {String} durata_hhmmss Durata nel formato HH:MM:SS
 * @apiSuccess {String} durata_s Durata in secondi
 * @apiSuccess {String} mezzo_trasporto Il mezzo inserito nella richiesta (solo per controllo)
 * @apiSuccess {String} cap_partenza Il CAP di partenza inserito nella richiesta (solo per controllo)
 * @apiSuccess {String} cap_destinazione Il CAP di destinazione inserito nella richiesta (solo per controllo)
 * @apiSuccessExample {json} Esempio-Risposta:
 *     {
 *         "durata_hhmmss":"00:58:07",
 *         "durata_s":"3487.8",
 *         "mezzo_trasporto":"driving-car",
 *         "cap_partenza":"00020",
 *         "cap_destinazione":"00183"
 *     }
*/
router.get('/durata/:mezzo_trasporto/:cap_partenza/:cap_destinazione', function (req, res) {
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
								res.status(200).json({
									durata_hhmmss: msToHHMMSS(duration * 1000).toString(),
									durata_s: duration.toString(),
									distanza: distance.toString(),
									mezzo_trasporto: mezzo_trasporto,
									cap_partenza: cap_partenza,
									cap_destinazione: cap_destinazione,
								});
							}
							else {
								res.status(404).json({
									errore: 'Impossibile trovare un percorso compatibile con i parametri specificati, prova un CAP di partenza/destinazione limitrofo'
								});
							}
						}
						else if (!error3 && response2.statusCode === 404) {
							res.status(404).json({
								errore: 'Impossibile trovare un percorso compatibile con i parametri specificati',
								dettaglio_errore: response3.body ? response3.body.error : null
							});
						}
						else {
							res.status(404).json({
								errore: 'Errore inaspettato nella ricerca di un percorso',
								dettaglio_errore: response3.body ? response3.body.error : null
							});
						}
					});
				}
				else if (!error2 && response2.statusCode === 404) {
					res.status(404).json({
						errore: 'Il CAP di destinazione non è valido'
					});
				}
				else {
					res.status(404).json({
						errore: 'Errore inaspettato nell\'elaborazione del CAP di arrivo'
					});
				}
			});
		}
		else if (!error1 && response1.statusCode === 404) {
			res.status(404).json({
				errore: 'Il CAP di partenza non è valido'
			});
		}
		else {
			res.status(404).json({
				errore: 'Errore inaspettato nell\'elaborazione del CAP di partenza'
			});
		}
	});
});



/**
 * @api {get} /distanza/:mezzo_trasporto/:cap_partenza/:cap_destinazione Distanza stimata viaggio
 * @apiGroup Viaggio
 * @apiDescription Restituisce la distanza stimata del viaggio tra cap_partenza e cap_destinazione con mezzo_trasporto
 * @apiParam mezzo_trasporto Mezzo di trasporto, può essere scelto fra: TODO
 * @apiParam cap_partenza CAP di partenza
 * @apiParam cap_destinazione CAP di destinazione
 * @apiParamExample {json} Esempio-Richiesta:
 *     {
 *         "mezzo_trasporto": "driving-car",
 *         "cap_partenza": "00020",
 *         "cap_destinazione": "00183"
 *     }
 * @apiSuccess {String} distanza_m Distanza in metri
 * @apiSuccess {String} mezzo_trasporto Il mezzo inserito nella richiesta (solo per controllo)
 * @apiSuccess {String} cap_partenza Il CAP di partenza inserito nella richiesta (solo per controllo)
 * @apiSuccess {String} cap_destinazione Il CAP di destinazione inserito nella richiesta (solo per controllo)
 * @apiSuccessExample {json} Esempio-Risposta:
 *     {
 *         "distanza":"61887.5",
 *         "mezzo_trasporto":"driving-car",
 *         "cap_partenza":"00020",
 *         "cap_destinazione":"00183"
 *     }
*/
router.get('/distanza/:mezzo_trasporto/:cap_partenza/:cap_destinazione', function (req, res) {
	let cap_partenza = req.params.cap_partenza;
	let cap_destinazione = req.params.cap_destinazione;
	//TODO
	let distanza_m = 10000;
	res.status(200).json({ errore: null, cap_partenza: cap_partenza, cap_destinazione: cap_destinazione, distanza_m: distanza_m });
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