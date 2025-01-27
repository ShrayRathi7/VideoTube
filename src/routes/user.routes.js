import { Router } from "express";
import { loginUser, registerUser, logoutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

//hum ek middleware inject kar rhe hai (upload.fields) matlab jab "register" route hit hoga to "registerUser" pe control jaane se pehle ye jo middleware hai vo execute hoga
//hume avatar aur cover image upload karni hai to ye jo "fields" method hai ye ek middleware return karta hai that processes multiple files
router.route("/register").post( //When a POST request is made to /register, the middleware and the registerUser handler function are executed sequentially.
  upload.fields([  //Purpose: This middleware is part of the multer library, used for handling file uploads in Node.js
    {
      name: "avatar",
      maxCount: 1, //1 hi file accept karunga
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),          //After processing the request: The uploaded files will be available in req.files.
  registerUser //After the file upload middleware (upload.fields) processes the request, the registerUser function is called. Purpose: This is the main handler for processing the registration logic.
);
//Note : Jo bhi method execute ho rha hai(registerUser in this case), us se pehle middleware use kar lo

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)//First, verifyJWT middleware will work then logoutUser function will be executed

router.route("/refresh-token").post(refreshAccessToken)

export default router;
