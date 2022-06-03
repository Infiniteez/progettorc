const DEFAULT_PORT = '8888';

require('dotenv').config();

const authRouter = require('./routes/auth'),
	indexRouter = require('./routes/index'),
	express = require('express'),
	passport = require('passport'),
	path = require('path'),
	bodyParser = require('body-parser');


const app = express(); // 


app.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'pug')
	.use(express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')))
	.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons', 'font')))
	.use(express.static(path.join(__dirname, 'public')))
	.use(require('cookie-parser')())
	.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }))
	.use(passport.initialize())
	.use(passport.session())
	.use('/', indexRouter)
	.use('/', authRouter)
	.use(bodyParser.urlencoded({extended:false}))
	.use(bodyParser.json());

app.listen(process.env.PORT || DEFAULT_PORT);
