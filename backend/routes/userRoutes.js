import express from 'express'
import { register , loginUser , saveSearch , guestsearch , addFavorite , removeFavorite , getFavorites , checkFavorite } from '../controller/userController.js'
import authUser from '../middleware/userAuth.js'

const userRouter = express.Router()

// login
userRouter.post('/register' , register)
userRouter.post('/login' , loginUser)

// Search
userRouter.post('/saveSearch' , authUser , saveSearch)
userRouter.post('/guestSearch' , guestsearch)

// favorite
userRouter.post('/favorite/add', authUser, addFavorite);
userRouter.delete('/favorite/remove', authUser, removeFavorite);
userRouter.get('/favorite/list', authUser, getFavorites);
userRouter.get('/favorite/check/:propertyId', authUser, checkFavorite);

export default userRouter