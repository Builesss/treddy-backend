import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import passport from './config/passport';
import bodyParser from 'body-parser';
import session from 'express-session';

import paymentRoutes from "./routes/payment.routes";
import figurasRoutes from './routes/figuras.routes';
import authRoutes from "./routes/auth.routes";
import redirectRoutes from "./routes/redirect.routes";
import userRoutes from "./routes/users.routes";
import cartRoutes from "./routes/cart.routes";
import gcsRoutes from "./routes/gcs.routes";
import resenasRoutes from "./routes/resenas.routes";
import addressRoutes from "./routes/address.routes";
import checkoutRoutes from "./routes/checkout.routes";
import orderRoutes from "./routes/order.routes";
import newsletterRoutes from "./routes/newsletter.routes";
import { setupSwagger } from "./swagger";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://treddy-frontend-86vmawtn3-builesss-projects.vercel.app',
        'https://treddy-frontend-bv53h5ki8-builesss-projects.vercel.app',
        'https://treddy-frontend.vercel.app'
      ].filter(Boolean) as string[];

      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(helmet());
app.use(morgan('dev'));
app.use(compression());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'treddy_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, 
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/images', express.static(path.join(__dirname, '../src/public/images')));

setupSwagger(app);

app.use('/api/figuras', figurasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/gcs', gcsRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/', redirectRoutes);

export default app;
