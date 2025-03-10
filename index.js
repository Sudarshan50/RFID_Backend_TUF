import e from 'express';
import dotenv from 'dotenv';
import { dbConnect } from './lib/db.js';
import AdminRouter from './routes/adminRoutes.js';
import masterRouter from './routes/masterRoute.js';


const app = e();
dotenv.config();
const port = process.env.PORT || 3000;
app.use(e.json());



app.use('/api/admin', AdminRouter);
app.use('/api/master',masterRouter);



dbConnect().then(()=>{
    app.listen(port, ()=>{
        console.log(`Server is running on port ${port}`);
    })
})