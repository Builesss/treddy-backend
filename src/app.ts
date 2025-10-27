import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import paymentRoutes from "./routes/payment.routes";
import figurasRoutes from './routes/figuras.routes';
import authRoutes from "./routes/auth.routes";
import redirectRoutes from "./routes/redirect.routes";
import userRoutes from "./routes/users.routes";
import cartRoutes from "./routes/cart.routes";
import { setupSwagger } from "./swagger";

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://4ac7b7a2a950.ngrok-free.app',
    ],
  })
);
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());

app.use('/images', express.static(path.join(__dirname, '../src/public/images')));

setupSwagger(app);

app.use('/api/figuras', figurasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cart', cartRoutes); 
app.use('/', redirectRoutes);

export default app;
