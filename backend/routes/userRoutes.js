import express from 'express'
import { register , loginUser , saveSearch , guestsearch} from '../controller/userController.js'
import authUser from '../middleware/userAuth.js'

const userRouter = express.Router()

userRouter.post('/register' , register)
userRouter.post('/login' , loginUser)
userRouter.post('/saveSearch' , authUser , saveSearch)
userRouter.post('/guestSearch' , guestsearch)

export default userRouter