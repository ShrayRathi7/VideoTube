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

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body //user jab request bhejega tab vo dono password enter karega. Pehla hoga uska old password aur dusra hoga new password
    //  console.log(req.body);

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword); //User ne jo old password bheja, vo compare hoga hashed password jo db mai store hai and this method will either either return true or false

    if(!isPasswordCorrect) {
        throw new apiError(400,"Invalid old password")
    }

    user.password =  newPassword //responsible for hashing the password before saving it to the database. This functionality is typically implemented in the User model using pre-save hooks.
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new apiResponse(
        200,
        {},
        "Password changed successfully"
    ))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json( new apiResponse(
        200,
        req.user,
        "current user fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body;

    if(!fullName || !email) {
        throw new apiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName : fullName,
                email : email
            }
        },
        {new : true} //Update hone ke baad ki jo info hai vo return hoti hai
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200, user, "Account Details updated")
    )
}) 

const updateUserAvatar = asyncHandler(async(req,res)=>{ 
    const avatarLocalPath = req.file?.path // Multer adds a `file` object to the request (`req`), which contains details about the uploaded file. So, `req.file` would be the file that was uploaded. 

    //The `path` property of the `file` object typically refers to the temporary location where the uploaded file is stored on the server. 
    // So, `avatarLocalPath` is getting the local file path of the uploaded avatar image.
    //when you upload a file using Multer, it gets saved to a temporary directory, and `path` gives you that location. Also, if there's no file uploaded, `req.file` would be undefined, so `avatarLocalPath` would be undefined as well. That's why optional chaining is used here to avoid errors.
    
    if(!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){ //Whenever we upload something on cloudinary, in return we get a url 
        throw new apiError(400, "Error while uploading avatar");
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            user,
            "Avatar updated"
        )
    )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new apiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url) {
        throw new apiError(400, "Error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            user,
            "Cover image updated"
        )
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
     const{username} = req.params // Jab bhi ham kisi channel ko visit karte hai to hum actually mai us channel ke url pe visit karte hai e.g. : /chai-aur-code
     //So, req.params is used for route parameters. For example, if the route is `/users/:username`, then `:username` is a parameter in the URL. So when a client makes a request to `/users/johndoe`, `req.params.username` would be "johndoe". This is part of the URL structure. 
     //req.params is used to extract values from the URL path (route parameters).

     if(!username?.trim()) {
        throw new apiError(400, "username is missing")
     }

    const channel = await User.aggregate([
        {
            $match : { //similar to WHERE clause in SQL(Here we are looking for a user with a specific username)
                username : username?.toLowerCase()
            }
        },
        {
            //to count the total subscribers of a channel
            $lookup : {
                from : "subscriptions",//model mai everything gets converted to lowercase and becomes plural (check in subscription.model.js, there name is Subscription)
                localField : "_id",
                foreignField : "channel",//To count the number of subscribers of a channel, count all the documents in which that particular channel name is appearing
                as : "subscribers"
            }
        },
        {
            //to count the no. of channels a user has subscribed
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers" //'$' is liye bcz subscribers is now a field ('as' field of first lookup)
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : { //condition
                        if : {$in : [req.user?._id, //to check if I (subscriber) am in the list of subscribers or not. If yes return true else false
                             "$subscribers.subscriber"]},
                             // subscribers is an array of documents (consisting of a list of subscribers who have subscribed to a particular channel) retrieved using $lookup from the "subscriptions" collection.
                             // Each document in subscribers has a field subscriber, which holds the ID of a user who subscribed.
                             // subscribers.subscriber extracts these user IDs into an array.
                             // $in checks whether the logged-in user’s ID (req.user?._id) is inside this array.
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : { //will provide only some values (not all). Basically it selects which fields to include in the output
                fullName : 1, //1 means I am providing this value(fullName)
                username : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1
            }
        }

    ])
    //channel returns an array
    if(!channel?.length) {
        throw new apiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            channel[0],
            "User channel fetched successfully"
        )
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [ 
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched succesfully"
        )
    )
})

export {
       registerUser,
       loginUser,
       logoutUser,
       refreshAccessToken,
       getCurrentUser,
       updateUserAvatar,
       updateUserCoverImage,
       getUserChannelProfile,
       getWatchHistory
    }

 