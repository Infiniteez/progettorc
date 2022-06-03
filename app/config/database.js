const mongoose = require('mongoose');

mongoose.connect('mongodb://admin:admin@localhost:27017/progettorc?authSource=admin')
	.then(() => console.log('connected'))
	.catch(e => console.log('error ' + e));

