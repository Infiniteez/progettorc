require('dotenv').config();

const mongoose = require('mongoose');

mongoose.connect('mongodb://admin:admin@' + (process.env.DB_NAME || 'localhost') + ':27017/progettorc?authSource=admin')
	.then(() => console.log('connessione a mongodb effettuata'))
	.catch(e => console.log('errore nella connessione a mongodb ' + e));

