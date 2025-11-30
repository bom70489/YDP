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

    // ดึงข้อมูล user ล่าสุด
    const user = await userModel.findById(req.user._id);
    
    console.log('🔍 Before - Length:', user.searchHistory.length);
    
    // เพิ่มข้อมูลใหม่
    user.searchHistory.push({ query, timestamp: new Date() });
    
    // เก็บเฉพาะ 20 รายการล่าสุด
    const latestSearches = user.searchHistory.slice(-20);
    
    // Update โดยการเขียนทับทั้งหมด
    await userModel.findByIdAndUpdate(
      req.user._id,
      { $set: { searchHistory: latestSearches } }
    );
    
    console.log('✅ After - Length:', latestSearches.length);
    
    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ success: false, message: error.message });
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

const addFavorite = async (req, res) => {
    try {
        const { propertyId } = req.body;
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        // ตรวจสอบว่ามีอยู่แล้วหรือไม่
        const user = await userModel.findById(req.user._id);
        const exists = user.favorites.some(fav => fav.propertyId === propertyId);

        if (exists) {
            return res.json({ success: false, message: 'Already in favorites' });
        }

        // เพิ่มเข้า favorites
        await userModel.findByIdAndUpdate(req.user._id, {
            $push: { favorites: { propertyId, addedAt: new Date() } }
        });

        res.json({ success: true, message: 'Added to favorites' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


const removeFavorite = async (req, res) => {
    try {
        const { propertyId } = req.body;
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        await userModel.findByIdAndUpdate(req.user._id, {
            $pull: { favorites: { propertyId } }
        });

        res.json({ success: true, message: 'Removed from favorites' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


const getFavorites = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const user = await userModel.findById(req.user._id).select('favorites');
        res.json({ success: true, favorites: user.favorites });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


const checkFavorite = async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const user = await userModel.findById(req.user._id);
        const isFavorite = user.favorites.some(fav => fav.propertyId === propertyId);

        res.json({ success: true, isFavorite });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { register , loginUser , saveSearch , guestsearch , addFavorite , removeFavorite , getFavorites , checkFavorite}