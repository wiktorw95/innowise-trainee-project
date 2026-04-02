import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_secret',
      // Best practice: Move this to your .env file eventually!
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3002/auth/google/callback',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        // Extract the primary email from the Google profile
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'), false);
        }
        const user = {
          googleId: profile.id,
          email: email,
        };

        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);
