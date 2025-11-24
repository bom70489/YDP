import express from 'express'
import { register , loginUser , saveSearch } from '../controller/userController.js'
import authUser from '../middleware/userAuth.js'

const userRouter = express.Router()

userRouter.post('/register' , register)
userRouter.post('/login' , loginUser)
userRouter.post('/saveSearch' , authUser , saveSearch)

export default userRouter