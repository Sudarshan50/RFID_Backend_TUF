import e from 'express';
import dotenv from 'dotenv';
import { dbConnect } from './lib/db.js';
import AdminRouter from './routes/adminRoutes.js';
import masterRouter from './routes/masterRoute.js';
import cors from 'cors';


const app = e();
dotenv.config();
const port = process.env.PORT || 3000;
app.use(e.json());
app.use(cors());
app.use(e.urlencoded({ extended: true }));




app.use('/api/admin', AdminRouter);
app.use('/api/master',masterRouter);



dbConnect().then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  });