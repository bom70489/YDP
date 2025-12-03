import express from 'express'
import cors from 'cors'
import axios from 'axios'
import connectDb from './config/mongodb.js';
import 'dotenv/config'
import userRouter from './routes/userRoutes.js';

const app = express();
app.use(cors())
app.use(express.json())
connectDb()

app.use('/api/user' , userRouter)

app.get("/", (req, res) => {
  res.send("Server is running ");
});

app.listen(4000, () => console.log("Server running on port 4000"));