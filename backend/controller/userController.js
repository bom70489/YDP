import jwt from 'jsonwebtoken'
import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../model/userModel.js'
import guestSearchModel from '../model/guestModel.js'

const createToken = (id) => {
    return jwt.sign({ id } , process.env.JWT_SECRET , { expiresIn : '7d' })
}

const register = async (req , res) => {
    try {
        const { name , email , password } = req.body

        const exists = await userModel.findOne({ email })

        if(exists) {
            return res.json({success : false , message : "Email already exists"})
        }

        if(!validator.isEmail(email)) {
            return res.json({success : false ,  message : "Please enter a valid email"})
        }

        if(password.length < 8) {
            return res.json({success : false , message : "Please enter a strong password"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashpassword = await bcrypt.hash(password , salt)

        const newUser = new userModel({
            name,
            email,
            password : hashpassword
        })

        const user = await newUser.save()
        const token = createToken(user._id)

        res.json({ success : true , token , username : user.name })

    } catch (error) {
        console.log(error);
        res.json({success : false , message : error.message})
    }
}

const loginUser = async (req , res) => {
    try {
        
        const {email , password} = req.body

        const user = await userModel.findOne({email})

        if(!user) {
            return res.json({success : false , message : "User doesn't exists"})
        }

        const Match = await bcrypt.compare(password , user.password)

        if(Match) {
            const token = createToken(user._id)
            res.json({success : true , token , username : user.name})
        } else {
            res.json({success : false , message : "Invild credentials"})
        }

    } catch (error) {
        console.log(error);
        res.json({success : false , message : error.message})
    }
}

const saveSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    req.user.searchHistory.push({ query, timestamp: new Date() });
    await req.user.save();
    res.json({ success: true });

  } catch (error) {
    res.json({success : false , message : error.message})
  }
};

const guestsearch = async (req , res) => {
    try {
        const { query } = req.body;
        await guestSearchModel.create({ query });
        
        const count = await guestSearchModel.countDocuments();

        if (count > 100) {
        const oldest = await guestSearchModel.find().sort({ timestamp: 1 }).limit(count - 100);
        const idsToDelete = oldest.map(item => item._id);
        await guestSearchModel.deleteMany({ _id: { $in: idsToDelete } });
        }

        res.json({ success: true });
    } catch (error) {
        res.json({success : false , message : error.message})
    }
    
}

export { register , loginUser , saveSearch , guestsearch}