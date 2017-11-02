/**
 * Module dependencies.
 */
var util = require('util');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var InternalOAuthError = require('passport-oauth').InternalOAuthError;

/**
 * `Strategy` constructor.
 *
 * The Dropbox authentication strategy authenticates requests by delegating to
 * Dropbox using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occurred, `err` should be set.
 *
 * Options:
 *   - `apiVersion`    (optional) the Dropbox API version to use (either '1' or '2'). Default is '1'.
 *   - `clientID`      your Dropbox application's app key found in the App Console
 *   - `clientSecret`  your Dropbox application's app secret
 *   - `callbackURL`   URL to which Dropbox will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new DropboxStrategy({
 *         clientID: 'yourAppKey',
 *         clientSecret: 'yourAppSecret'
 *         callbackURL: 'https://www.example.net/auth/dropbox-oauth2/callback',
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};

  this._apiVersion = '2';

  options.authorizationURL = options.authorizationURL || 'https://www.dropbox.com/oauth2/authorize';
  options.tokenURL = options.tokenURL || 'https://api.dropbox.com/oauth2/token';

  options.scopeSeparator = options.scopeSeparator || ',';
  options.customHeaders = options.customHeaders || {
    'Content-Type': 'application/json',
  };

  OAuth2Strategy.call(this, options, verify);
  this.name = 'dropbox-business';
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Use a different method of the OAuth2Strategy for making an external request to the selected Dropbox API version.
 * Currently API v2 supports only POST requests for retrieving the admin user's profile.
 *
 * @param {String} accessToken
 * @param {String} cursor
 * @param {Function} cb
 * @private
 */
Strategy.prototype._getAdminProfile = function (accessToken, cursor, cb) {
  var self = this;
  var url = 'https://api.dropboxapi.com/2/team/members/list';
  var body = null;
  if (cursor) {
    url += '/continue';
    body = {
      cursor: cursor,
    };
  }
  self._oauth2._request(
    'POST',
    url,
    {
      Authorization: self._oauth2.buildAuthHeader(accessToken),
    },
    JSON.stringify(body),
    accessToken,
    function (err, body) {
      if (err) return cb(err);
      var adminProfile;
      try {
        body = JSON.parse(body);
        body.members.forEach(function (member) {
          if (member.role['.tag'] === 'team_admin') adminProfile = member.profile;
        });
        if (adminProfile) {
          return cb(null, adminProfile);
        }
        if (!body.has_more) {
          return cb(new Error('Unable to find member with role team_admin'));
        }
        self._getAdminProfile(accessToken, body.cursor, cb);
      } catch (e) {
        cb(e);
      }
    });
};

/**
 * Retrieve the admin user's profile from Dropbox for Business.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `dropbox`
 *   - `id`               the user's unique Dropbox ID
 *   - `displayName`      a name that can be used directly to represent the name of an admin user's Dropbox for Business account
 *   - `emails`           the user's email address
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function (accessToken, done) {
  console.warn('using dropbox business strategy');
  this._getAdminProfile(accessToken, '', function (err, body, res) {
    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

    try {
      var profile = {
        provider: 'dropbox',
        id: body.account_id,
        displayName: body.name.display_name,
        name: {
          familyName: body.name.surname,
          givenName: body.name.given_name,
          middleName: '',
        },
        emails: [{ value: body.email }],
        _json: body,
      };

      done(null, profile);
    } catch (e) {
      done(e);
    }
  }.bind(this));
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
