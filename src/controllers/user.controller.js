import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        console.log("user id :", userId);
        console.log("user :", user);
        if(!user){
            throw new apiError(404, "User not found")
        }
        const accessToken = user.generateAccessToken() //this function is a part of user.model.js
        const refreshToken = user.generateRefreshToken()//this function is a part of user.model.js

        console.log("Access Token : ", accessToken);
        console.log("Refresh Token : ", refreshToken);

        user.refreshToken = refreshToken; //refreshToken database mai save kara diya (user is a document and refreshToken is one of its properties; Check user.model.js)
        await user.save({validateBeforeSave : false}) // to save a Mongoose document to the database while skipping validation that would normally occur before saving the document.
        //By default, when you call .save(), Mongoose will run any validation rules that are defined in the schema (e.g., checking if required fields are provided, if data types are correct, etc.).

        return {accessToken, refreshToken}

    }
    catch(error) {
        console.log("Error details : ",error);
        throw new apiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async ( req,res ) => {
    // res.status(200).json({
    //     message : "Shray Rathi"
    // })
    //get user details from frontend
    //validation (like email correct format mai hai ki nhi)
    //check if user already exists
    //check for images, check for avatar
    //upload them to cloudinary
    //create use object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response

    const {fullName, email, username, password}=req.body;
   // console.log("Email is : ",email);

    if(fullName === "") {
        throw new apiError(400, "Full name is required")
    }

    if(
        [fullName, email, username, password].some((field)=>
        field ?.trim()==="")
    ) {
        throw new apiError(400, "All fields are required") // 400 is the status code and the string is the message
    }

    const existedUser = await User.findOne({
        $or : [{ username: username }, { email: email }]
    })

    if(existedUser) {
        throw new apiError(409, "User with given username or email already exists")
    }

    //hamare middleware ne 2 files li thi(avatar aur coverImage). Using req.files I can access those files
    //req.files : This is the object where Multer stores the uploaded files.
    //The reason for accessing avatar[0] is that Multer stores uploaded files in arrays, even if you expect only one file for a specific field.
    //path : Refers to the path where Multer stored the uploaded file locally.
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path; //[0]: Accesses the first file in the avatar array. Even if only one file is uploaded, it will still be stored as the first (and only) item in the array.
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) &&    //just another way of getting the path of cover image just like we got the path of avatar
       req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
       }

    if(!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath) //uploading an avatar on cloudinary is a time taking task that is why ham ne await lagaya hai taaki jab tak upload na ho jaye tab tak aage mat jaana
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   

    if(!avatar) { //agar avatar upload nhi ho paaya
        throw new apiError(400, "Avatar file is missing")
    }

    console.log("Avatar uploaded :", avatar.url);

    //creating a new record in a database. It creates a user record with specific properties (e.g., fullName, avatar, coverImage):
    const user = await User.create({
        fullName,
        avatar : avatar.url, //Sets the avatar property in the database to the value of avatar.url
        //avatar is likely an object representing an uploaded file (from Cloudinary), and url is the public URL of the uploaded avatar image.
        coverImage: coverImage.url?.url || "", //agar coverImage hai to uska url le lo nhi to use khaali hi chod do(Avatar ka to hum upar check kar chuke so we're sure that avatar to hamare paas aa hi gya hai but coverImage ke liye koi check nhi lagaya tha ham ne upar)
        email,
        password,
        username :  username.toLowerCase()
    })

    //In MongoDB, _id is the primary key field for every document (a row in relational DB = document in mongoDb) in a collection. It is a unique identifier that distinguishes each document within a collection. 
    const createdUser = await User.findById(user._id).select(
        "-password -refresToken" //Specifies which fields to exclude in the query result.
    )
    //Why Exclude password and refreshToken?
    // Security:
    // The password field often contains a hashed version of the user's password, which should not be exposed.
    // The refreshToken might be sensitive data used for authentication and should also not be exposed unnecessarily.

    if(!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully") //create an object of class apiResponse 
        //200 is the status code
    )
    
    //201: Indicates that a resource has been successfully created. This is appropriate for actions like user registration or adding a new item.
    //.json() -> Purpose: Sends a JSON response to the client. It converts the provided object to JSON format.
//new apiResponse(200, createdUser, "User registered successfully")
// Purpose: Creates an instance of the apiResponse class (custom-defined).
// Structure: The constructor likely accepts:
// 200: Represents a secondary status code for internal use, indicating success.
// createdUser: The newly created user object (or data) to be returned in the response.
// "User registered successfully": A message to convey the operation's result to the client.
})

const loginUser = asyncHandler( async (req,res) => {
    //req body se data le aao
    //username, email exists or not
    //find the user
    //password check
    //generate access and refresh token
    //send cookies

    const{email,username,password} = req.body;
    console.log(email);

    // if(!username || !email) {
        if(!username && !email) {
        throw new apiError(400, "username or email is required");
    // }
}

    const user = await User.findOne({ //The query is looking for a document where either the username or the email matches the values passed in.
        $or: [{username},{email}]     //This could be used in scenarios like searching for a user by username or email, or when you want to return a user who might have forgotten one of the two fields.
    })

    if(!user) {
        throw new apiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
 
    if(isPasswordValid == false) {
        throw new apiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true //By default frontend pe cookies ko koi bhi modify kar sakta hai but when we mark these 2 methods true, then these cookies can't be modified by frontend, they can then only be modified by the server     
    }

    return res.
    status(200).
    cookie("accessToken", accessToken, options).
    cookie("refreshToken", refreshToken, options).
    json(
        new apiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )

} )

const logoutUser = asyncHandler(async(req,res)=>{ 
    await User.findByIdAndUpdate(
        req.user._id,
        {         //kya update karna hai vo batao
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options) //method in Express, used to delete a cookie stored in the client’s browser.
    .clearCookie("refreshToken",options)
    .json(new apiResponse(200,{},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body; //cookies se refresh token le aao
    
    if(!incomingRefreshToken) {
        throw new apiError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify( //get the decoded token(secret info)
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new apiError(401, "Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken) { //hamne database mai refresh token store karaya hai corresponding to every user. Here we are comparing that refresh token with the incomingRefreshToken to check whether they are same. If yes, then we'll update the value of access token after it expires
            throw new apiError(401, "Refresh token has expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new apiResponse(
                200,
                {newAccessToken, newRefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token");
    }
})

export {registerUser,
     loginUser,
      logoutUser,
       refreshAccessToken
    }

 