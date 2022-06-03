const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	spotify_id: { type: String, unique: true },
	email: String,
	access_token: String,
	refresh_token: String
}, { timestamps: true });

var User = mongoose.model('User', UserSchema);

module.exports = User;