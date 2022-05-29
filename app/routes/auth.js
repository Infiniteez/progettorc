const express = require('express');
const request = require('request');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPE = 'user-read-private user-read-email';
const STATE_KEY = 'spotify_auth_state'; // nome del cookie per lo state

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// auth/callback
router.get('/login', function (req, res) {

    const refresh_token = req.cookies.refresh_token;
    if (refresh_token) {
        res.redirect('getnewaccesstoken');
        return;
    }

    const STATE = generateRandomString(16);
    res.cookie(STATE_KEY, STATE);

    res.redirect('https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: SCOPE,
            redirect_uri: REDIRECT_URI,
            state: STATE
        }));
});

// auth/callback
router.get('/callback', function (req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[STATE_KEY] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            new URLSearchParams({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(STATE_KEY);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;
                var expires_in = body.expires_in;

                res.cookie('access_token', access_token, { maxAge: expires_in, httpOnly: true, secure: true });
                res.cookie('refresh_token', refresh_token, { maxAge: 86400000 /* 1 giorno */, httpOnly: true, secure: true });

                /**/
                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (_error, _response, body) {
                    console.log(body);
                });
                /**/

                res.redirect('/');
            } else {
                res.redirect('/#' +
                    new URLSearchParams({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

router.get('/getnewaccesstoken', function (req, res) {

    // requesting access token from refresh token
    var refresh_token = req.cookies.refresh_token;

    if (refresh_token == null) {
        res.redirect('/login');
        return;
    }

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var new_access_token = body.access_token;
            var expires_in = body.expires_in;

            res.cookie('access_token', new_access_token, { maxAge: expires_in, httpOnly: true, secure: true });
            res.redirect('/');
        } else {
            res.redirect('/#' +
                new URLSearchParams({
                    error: 'invalid_token'
                }));
        }
    });
});


module.exports = router;