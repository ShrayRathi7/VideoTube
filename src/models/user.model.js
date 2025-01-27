import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
        },
        fullName : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String, //cloudinary url
            required : true,
        },
        coverImage : {
            type : String // cloudinary url
        },
        watchHistory : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required : [true, 'Password is required']
        },
        refreshToken : {
            type : String 
        }
    },
    {
        timestamps : true
    }
)

//lines 72-77 :
// This registers a middleware that is executed before the save operation for a Mongoose model based on this schema.
// Mongoose pre middlewares allow you to run custom logic before certain actions, such as saving or updating a document.

// The middleware is declared as an async function because it uses an asynchronous operation (bcrypt.hash).
// The next parameter is a callback function that you must call to proceed to the next middleware or to complete the save operation.

// bcrypt.hash is an asynchronous function that generates a hashed version of the password.
// The second argument (10) is the salt rounds, determining the cost factor for hashing. A higher value makes hashing more secure but slower.

// next() is a callback that signals Mongoose to proceed with the next middleware or save operation.
// If next() is not called, the save operation will be stuck and never complete.

// Purpose of This Middleware : 
// -> The main goal of this middleware is to securely hash the password before saving it to the database.
//-> It ensures that:
// 1. Passwords are not stored in plaintext, reducing the risk of exposing sensitive data in case of a database breach.
// 2. Hashing only happens when the password is newly set or updated, avoiding unnecessary re-hashing of unchanged passwords.

userSchema.pre("save", async function (next) {
    if(! this.isModified("password"))
        return next(); // Skip hashing if password has not been modified
    this.password = await bcrypt.hash(this.password, 10)//hash the password
    next()//call the next middleware
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password) //password -> jo user ne enter kiya and this.password -> hashed password
}

userSchema.methods.generateAccessToken = function(){
    console.log("Access Token Expiry:", process.env.ACCESS_TOKEN_EXPIRY);
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '1h';
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined in the environment');
    }
    return jwt.sign( //The jwt.sign function from the jsonwebtoken library is used to create the JWT.
        { //This information can be used by the server to identify the user and provide context for the authenticated session. Example: An API might need the userId to retrieve data for that specific user.
            _id: this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        secret,
        {
            expiresIn : expiresIn
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    console.log("Refresh Token expiry : ", process.env.REFRESH_TOKEN_EXPIRY);
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)