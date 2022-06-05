const DEFAULT_PORT = '8080';

require('dotenv').config();

const authRouter = require('./routes/auth'),
	indexRouter = require('./routes/index'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	express = require('express'),
	session = require('express-session'),
	passport = require('passport'),
	path = require('path'),
	sessionstore = require('sessionstore');

const app = express();

app.disable('x-powered-by');
app.enable('trust proxy');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
	secret: 'super secret cat',
	proxy: true,
	key: 'session.sid',
	saveUninitialized: true,
	resave: false,
	cookie: { secure: true },
	store: sessionstore.createSessionStore({
		url: 'mongodb://admin:admin@' + (process.env.DB_NAME || 'localhost') + ':27017/progettorc?authSource=admin'
	})
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', indexRouter);
app.use('/', authRouter);

app.listen(process.env.PORT || DEFAULT_PORT);