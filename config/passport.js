import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../model/userModel.js";

export const initPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const isRegister = req.query.state === "register"; // ← safer than session
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value ?? null;

          if (!email)
            return done(new Error("No email returned from Google"), null);

          // ── Already has a Google account ──────────────────────
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            req.authNotice = isRegister ? "already_existed" : null;
            return done(null, user);
          }

          // ── Email exists (local account) → link Google to it ──
          let existingUser = await User.findOne({ email });
          if (existingUser) {
            req.authNotice = isRegister ? "already_existed" : "google_linked";
            existingUser.googleId = profile.id;
            existingUser.isVerified = true;
            existingUser.userExpire = null;
            if (existingUser.authProvider === "local") {
              existingUser.authProvider = "google+local";
            }
            await existingUser.save();
            return done(null, existingUser);
          }

          // ── Brand new user → create ───────────────────────────
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email,
            avatar,
            authProvider: "google",
            isVerified: true,
            isBlocked: false,
            userExpire: null,
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
