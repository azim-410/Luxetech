import express from 'express';
import session from 'express-session'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js'
import connectDB from './config/db.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
connectDB();


app.set('views',path.join(__dirname,"views"));
app.set('view engine','ejs');

app.use(express.static(path.join(__dirname, "public")));

app.use('/',authRoutes);

app.listen(process.env.PORT,()=>{
    console.log('\nserver running at port:'+process.env.PORT)
});
