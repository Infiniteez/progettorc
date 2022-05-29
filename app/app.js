const express = require('express'),
	session = require('express-session'),
	passport = require('passport'),
	SpotifyStrategy = require('passport-spotify').Strategy,
	path = require('path'),
	cookieParser = require('cookie-parser');

require('dotenv').config();

const SCOPE = ['user-read-private', 'user-read-email'];

passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (obj, done) {
	done(null, obj);
});

passport.use(
	new SpotifyStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: process.env.REDIRECT_URI,
		},
		function (accessToken, refreshToken, expires_in, profile, done) {
			// asynchronous verification, for effect...
			process.nextTick(function () {
				// To keep the example simple, the user's spotify profile is returned to
				// represent the logged-in user. In a typical application, you would want
				// to associate the spotify account with a user record in your database,
				// and return that user instead.
				return done(null, profile);
			});
		}
	)
);

const app = express();
const DEFAULT_PORT = '8888';

app.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'pug')
	.use(express.static(path.join(__dirname, 'public')))
	.use(express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')))
	.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons', 'font')))
	.use(cookieParser())
	.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }))
	.use(passport.initialize())
	.use(passport.session());


app.get('/', (req, res) => {
	const NODE = process.env.NODE_ENV || 'dev-local';
	const INSTANCE = process.env.INSTANCE || 'node';
	const PORT = process.env.PORT || DEFAULT_PORT;

	res.render('index', {
		title: 'Docker with Nginx and Express',
		node: NODE,
		instance: INSTANCE,
		port: PORT,
		user: req.user
	});
});

app.get('/account', ensureAuthenticated, function (req, res) {
	res.render('account', { user: req.user });
	console.log(req.user._json);
});

app.get('/login', passport.authenticate('spotify', { scope: SCOPE }));

app.get('/auth/callback', passport.authenticate('spotify', { failureRedirect: '/' }), function (req, res) {
	let prevSession = req.session;
	req.session.regenerate(() => {
		Object.assign(req.session, prevSession);
		res.redirect('/');
	});
}
);

app.get('/logout', function (req, res, next) {
	req.logout(function (err) {
		if (err) { return next(err); }
		res.redirect('/');
	});
});
app.listen(process.env.PORT || DEFAULT_PORT);

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.returnTo = req.originalUrl;
	res.redirect('/login');
}