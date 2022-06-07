const SPOTIFY_SCOPE = ['user-read-private', 'user-read-email', 'user-top-read'];

require('dotenv').config();
require('../config/database');

const User = require('../models/User'),
	express = require('express'),
	passport = require('passport'),
	refresh = require('passport-oauth2-refresh'),
	SpotifyStrategy = require('passport-spotify').Strategy;


const router = express.Router();


passport.serializeUser((user, done) => {
	done(null, user.spotify_id);
});

passport.deserializeUser((_id, done) => {
	User.findOne({
		spotify_id: _id
	}, (err, user) => {
		if (err) {
			done(null, false, { error: err });
		} else {
			done(null, user);
		}
	});
});

const strategy = new SpotifyStrategy(
	{
		clientID: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,

		// se la porta PORT è settata significa che siamo nel container quindi su nginx, quindi uso il REDIRECT_URI https
		callbackURL: process.env.DB_NAME ? process.env.REDIRECT_URI : process.env.REDIRECT_URI_LOCAL
	},
	function (access_token, refresh_token, _expires_in, profile, done) {
		// una volta settati clientID, clientSecret ecc. della passport strategy viene chiamata la
		// callback a cui viene passato access token, refresh token ecc.
		User.findOne({ 'spotify_id': profile.id }, function (err, user) { // mongoose
			if (err) {
				return done(err);
			}
			if (!user) { // l'utente non esiste, lo creo
				user = new User({
					spotify_id: profile.id,
					email: profile.emails[0].value,
					access_token: access_token,
					refresh_token: refresh_token
				});
				user.save(function (err) {
					if (err) console.log(err);
					return done(err, user);
				});
			} else { // l'utente esiste, lo restituisco
				return done(err, user);
			}
		});
	}
);

passport.use(strategy);
refresh.use(strategy);

router.get('/login', passport.authenticate('spotify', { scope: SPOTIFY_SCOPE, session: true }));

router.get('/auth/callback', passport.authenticate('spotify', { failureRedirect: '/', session: true }), function (req, res) {
	// genera una nuova sessione, a causa di vulnerabilità
	let prevSession = req.session;
	req.session.regenerate(() => {
		Object.assign(req.session, prevSession);
		res.redirect('/');
	});
});

router.get('/logout', function (req, res, next) {
	req.logout(function (err) {
		if (err) { return next(err); }
		res.redirect('/');
	});
});


module.exports = router;

module.exports.getNewAccessToken = function (user, callback) {
	refresh.requestNewAccessToken('spotify', user.refresh_token, function (_err, new_access_token) {
		user.access_token = new_access_token;
		user.save();
		callback();
	});
};