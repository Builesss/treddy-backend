import { Router } from 'express';
import { getFiguras } from '../controllers/figuras.controller';

const router = Router();

router.get('/', getFiguras); 

export default router;  