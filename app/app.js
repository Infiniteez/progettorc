const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/auth');

const app = express();
const DEFAULT_PORT = '8888';

app.use(express.static(path.join(__dirname, 'public')))
    .use(cookieParser())
    .use('/auth', authRouter);

app.set('views', path.join(__dirname, 'views'))
    .set('view engine', 'pug');

app.get('/', (_req, res) => {
    const NODE = process.env.NODE_ENV || 'dev-local';
    const INSTANCE = process.env.INSTANCE || 'node';
    const PORT = process.env.PORT || DEFAULT_PORT;

    res.render('index', {
        title: 'Docker with Nginx and Express',
        node: NODE,
        instance: INSTANCE,
        port: PORT
    });
});

app.listen(process.env.PORT || DEFAULT_PORT);
