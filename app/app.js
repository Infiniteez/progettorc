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

const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const amqp = require('amqplib/callback_api');


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

app.get('/chat', authRouter.ensureAuthenticated, function (req, res) {
	res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

app.post('/api/chat', authRouter.ensureAuthenticated, function (req) {
	amqp.connect('amqp://rabbitmq:5672', function (err, conn) {
		conn.createChannel(function (err, ch) {
			if (err) {
				throw new Error(err);
			}
			var ex = 'chat_ex';
			var payload = JSON.stringify({ name: req.user.spotify_id, message: req.body.message });
			ch.assertExchange(ex, 'fanout', { durable: false });
			ch.publish(ex, '', Buffer.from(payload), { persistent: false });
			ch.close(function () { conn.close(); });
		});
	});
});

if (process.env.NODE_ENV === 'test') {
	module.exports = server;
} else {
	var chat = io.of('/ciao');
	amqp.connect('amqp://rabbitmq:5672', function (err, conn) {
		conn.createChannel(function (err, ch) {
			if (err) {
				throw new Error(err);
			}
			var ex = 'chat_ex';

			ch.assertExchange(ex, 'fanout', { durable: false });
			ch.assertQueue('', { exclusive: true }, function (err, q) {
				if (err) {
					throw new Error(err);
				}
				ch.bindQueue(q.queue, ex, '');
				ch.consume(q.que, function (msg) {
					chat.emit('chat', msg.content.toString());
				});
			}, { noAck: true });
		});
	});
	server.listen(process.env.PORT || DEFAULT_PORT);
}
