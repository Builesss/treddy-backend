import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import figurasRoutes from './routes/figuras.routes';

const app = express();

// 🛡️ Configuración de middlewares
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());

app.use('/api/figuras', figurasRoutes);

export default app;