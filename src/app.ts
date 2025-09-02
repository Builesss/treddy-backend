import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { setupSwagger } from "./swagger";
import figurasRoutes from './routes/figuras.routes';
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());

app.use('/images', express.static(path.join(__dirname, '../src/public/images')));

setupSwagger(app);

app.use('/api/figuras', figurasRoutes);
app.use("/api/auth", authRoutes);

export default app;