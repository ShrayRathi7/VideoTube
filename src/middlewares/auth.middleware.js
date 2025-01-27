import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
// Client Request:
// The client sends a request to a protected route, including a token either in cookies (accesToken) or the Authorization header.

// Token Extraction:
// The verifyJWT middleware tries to extract the token from req.cookies or req.header.

// Token Missing:
// If no token is found, an error is thrown, and the client receives a 401 Unauthorized response.

// req.cookies?.accesToken:
// Checks if the token is stored in the accesToken field of cookies.
// The optional chaining operator (?.) prevents errors if req.cookies is undefined.

// req.header("Authorization")?.replace("Bearer ", ""):
// Checks the Authorization header of the request.
// The header typically has the format: Authorization: Bearer <token>.
// replace("Bearer ", "") removes the Bearer prefix to extract the raw token.

// ||:
// If the token is not found in cookies, it attempts to retrieve it from the Authorization header.
export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ","")
    
        if(!token) {
            throw new apiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify  //extract the secret info stored in token
        (token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id) //one of the secret info stored in token is '_id' (check user.model.js)
        .select("-password -refreshToken")
    
        if(!user) {
            throw new apiError(401,"Invalid Access Token")
        }
    
        req.user = user; //assigns the fetched user object to the user property of the req object. This is a common practice in Express applications to store information about the currently authenticated user so that it can be accessed by subsequent middleware functions or route handlers.
        //By adding user to the req object, the application can make the authenticated user's information available in the rest of the request lifecycle.

        next() //is middleware ka work is finished, go to the next middleware (check user.routes.js, logoutUser is the next middleware)
    } catch (error) {
        throw new apiError(401, error?.message || "invalid access token")
    }


})