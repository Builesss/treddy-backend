import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { OIDCStrategy as MicrosoftStrategy } from "passport-azure-ad";
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
              nombre: profile.name?.givenName || "Usuario",
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
      identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      responseType: "code",
      responseMode: "form_post",
      passReqToCallback: false,
      redirectUrl: process.env.MICROSOFT_CALLBACK_URL!,
      allowHttpForRedirectUrl: true,
      scope: ["openid", "profile", "email"],
    },
    async (
      _iss: string | undefined,
      _sub: string | undefined,
      profile: any,
      _accessToken: string | undefined,
      _refreshToken: string | undefined,
      done: (err: any, user?: any) => void
    ) => {
      console.log("🟢 [PASSPORT] → Callback de Microsoft recibido en la estrategia");

      try {
        if (!profile) {
          console.error("❌ [PASSPORT] → No se recibió el perfil de Microsoft");
          return done(new Error("Perfil vacío"), null);
        }

        console.log("👤 [PASSPORT] → Perfil recibido de Microsoft:");
        console.log({
          id: profile.id,
          displayName: profile.displayName,
          emails: profile._json?.email || profile._json?.preferred_username,
        });

        const email =
          profile._json?.email ||
          profile._json?.preferred_username ||
          profile.emails?.[0]?.value;

        if (!email) {
          console.error("❌ [PASSPORT] → No se pudo obtener el correo electrónico del perfil");
          return done(new Error("No se pudo obtener el correo"), null);
        }

        console.log(`📧 [PASSPORT] → Correo detectado: ${email}`);

        // Buscar usuario existente
        let user = await prisma.usuarios.findUnique({ where: { email } });

        if (!user) {
          console.log("🆕 [PASSPORT] → Usuario no encontrado, creando nuevo usuario en la base de datos...");
          user = await prisma.usuarios.create({
            data: {
              nombre: profile.displayName || "Usuario",
              apellido: "",
              email,
              telefono: "",
              contrasena: "",
              tipo_usuario: "cliente",
            },
          });
          console.log("✅ [PASSPORT] → Usuario creado exitosamente:", {
            id: user.usuario_id,
            email: user.email,
          });
        } else {
          console.log("👥 [PASSPORT] → Usuario existente encontrado:", {
            id: user.usuario_id,
            email: user.email,
          });
        }

        // Generar token JWT
        console.log("🔐 [PASSPORT] → Generando token JWT...");
        const token = jwt.sign(
          {
            id: Number(user.usuario_id),
            email: user.email,
            role: user.tipo_usuario,
          },
          process.env.JWT_SECRET!,
          { expiresIn: "7d" }
        );

        console.log("✅ [PASSPORT] → Token generado correctamente (truncado):", token.slice(0, 20) + "...");

        return done(null, { user, token });
      } catch (err: any) {
        console.error("🔥 [PASSPORT ERROR] → Error en la estrategia de Microsoft:");
        console.error(err);
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
