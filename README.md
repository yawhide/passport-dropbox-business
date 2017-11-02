# Passport-Dropbox-Business
[Passport](http://passportjs.org/) strategy for authenticating with [Dropbox for Business](https://dropbox.com/)
using the OAuth 2.0 API.

This module lets you authenticate using Dropbox for Business in your Node.js applications.
By plugging into Passport, Dropbox authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install
    $ npm install passport-dropbox-business

## Usage
### Configure Strategy

The Dropbox authentication strategy authenticates users using a Dropbox Admin account
and OAuth 2.0 tokens. The strategy requires a `verify` callback, which accepts
these credentials and calls `done` providing a user, as well as `options`
specifying a API version, client ID, client secret, and callback URL.

    passport.use(new DropboxOAuth2Strategy({
        apiVersion: '2',
        clientID: DROPBOX_CLIENT_ID,
        clientSecret: DROPBOX_CLIENT_SECRET,
        callbackURL: "https://www.example.net/auth/dropbox-business/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ providerId: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

### Authenticate Requests
Use `passport.authenticate()`, specifying the `'dropbox-business'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.get('/auth/dropbox',
      passport.authenticate('dropbox-business'));

    app.get('/auth/dropbox-business/callback',
      passport.authenticate('dropbox-business', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });

## Examples
Examples not yet provided

## Tests
Tests not yet provided


## Prior work
This strategy is based on Jared Hanson's GitHub strategy for passport: [Jared Hanson](http://github.com/jaredhanson)

## Credits and License
Inspiration from https://github.com/florianheinemann/passport-dropbox-oauth2
