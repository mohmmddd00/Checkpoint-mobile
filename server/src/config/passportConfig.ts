import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.js";

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: `${process.env.SERVER_URL || "http://localhost:5001"}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), undefined);

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
          // If the existing account is a local (email/password) account,
          // link it to Google: mark as verified, switch authProvider to google,
          // store the googleId, and clear any pending verification tokens.
          if (user.authProvider === "local") {
            user.googleId = profile.id;
            user.authProvider = "google";
            user.isVerified = true;
            user.verificationToken = null;
            user.verificationTokenExpiry = null;
            if (profile.photos?.[0]?.value && !user.profileImage) {
              user.profileImage = profile.photos[0].value;
            }
            await user.save();
          }

          // Existing user (now linked or already Google) — log them in
          return done(null, user);
        }

        // New Google user — create with temporary username
        // User will set a real username in the complete profile step
        try {
          user = await User.create({
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            email,
            googleId: profile.id,
            authProvider: "google",
            isVerified: true,
            profileImage: profile.photos?.[0]?.value || "",
            username: `user_${profile.id}`,
          });
        } catch (createErr: any) {
          if (createErr?.code === 11000) {
            user = await User.findOne({ googleId: profile.id }) || await User.findOne({ email });
            if (!user) return done(createErr, undefined);
          } else {
            return done(createErr, undefined);
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);

export default passport;