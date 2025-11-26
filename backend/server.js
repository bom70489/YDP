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

app.get("/ai/search", async (req, res) => {
  try {
    const { q , min_price , max_price} = req.query;

    const response = await axios.get("http://127.0.0.1:8000/hybrid_search", {
      params: { query: q , min_price , max_price}
    });

    res.json(response.data.results);

  } catch (error) {
    console.error("FastAPI error:", error?.response?.data || error.message);
    res.status(500).json({ error: "FastAPI failed", detail: error.message });
  }
});

app.use('/api/user' , userRouter)

app.get("/", (req, res) => {
  res.send("Server is running ");
});

app.listen(4000, () => console.log("Server running on port 4000"));