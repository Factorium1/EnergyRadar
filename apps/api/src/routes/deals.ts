import express, { Router } from 'express';

const router: Router = express.Router();

router.get('/', (req, res, next) => {
  res.json({ msg: 'this worked' });
});

export default router;
