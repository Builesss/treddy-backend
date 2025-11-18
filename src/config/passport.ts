import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import { PrismaClient } from "../generated/prisma";
import jwt from "jsonwebtoken";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

const prisma = new PrismaClient();

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No se pudo obtener el correo"), undefined);

        let user = await prisma.usuarios.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.usuarios.create({
            data: {
              nombre: profile.name?.givenName || profile.displayName || "Usuario",
              apellido: profile.name?.familyName || "",
              email,
              telefono: "",
              contrasena: "",
              tipo_usuario: "cliente",
            },
          });
        }

        const token = jwt.sign(
          { id: Number(user.usuario_id), email: user.email, role: user.tipo_usuario },
          process.env.JWT_SECRET!,
          { expiresIn: "7d" }
        );

        return done(null, { user, token });
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);

passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL!,
      scope: ["user.read"],
      tenant: "common",
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No se pudo obtener el email"), null);

        let user = await prisma.usuarios.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.usuarios.create({
            data: {
              nombre: profile.displayName || "Usuario Microsoft",
              apellido: "",
              email,
              telefono: "",
              contrasena: "",
              tipo_usuario: "cliente",
            },
          });
        }

        const token = jwt.sign(
          {
            id: Number(user.usuario_id),
            email: user.email,
            role: user.tipo_usuario,
          },
          process.env.JWT_SECRET!,
          { expiresIn: "7d" }
        );

        return done(null, { user, token });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (jwt_payload, done) => {
      try {
        const user = await prisma.usuarios.findUnique({
          where: { usuario_id: jwt_payload.id },
        });

        if (!user) return done(null, false);

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

export default passport;
