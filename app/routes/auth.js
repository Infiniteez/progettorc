const SPOTIFY_SCOPE = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-top-read'];

require('dotenv').config();
require('../config/database');

const User = require('../models/User'),
	express = require('express'),
	passport = require('passport'),
	refresh = require('passport-oauth2-refresh'),
	SpotifyStrategy = require('passport-spotify').Strategy;


const router = express.Router();


passport.serializeUser(function (user, done) {
	done(null, user.spotify_id);
});

passport.deserializeUser(function (id, done) {
	User.findOne({ 'spotify_id': id }, function (err, user) {
		done(err, user);
	});
});

const strategy = new SpotifyStrategy(
	{
		clientID: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		callbackURL: process.env.REDIRECT_URI
	},
	function (access_token, refresh_token, _expires_in, profile, done) {
		User.findOne({ 'spotify_id': profile.id }, function (err, user) {
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

router.get('/login', passport.authenticate('spotify', { scope: SPOTIFY_SCOPE }));

router.get('/auth/callback', passport.authenticate('spotify', { failureRedirect: '/' }), function (req, res) {
	let prevSession = req.session;
	req.session.regenerate(() => {
		Object.assign(req.session, prevSession);
		res.redirect('/');
	});
}
);

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

module.exports.ensureAuthenticated = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.returnTo = req.originalUrl;
	res.redirect('/login');
};