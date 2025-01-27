import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
})) //Jab bhi middlewares ki baat hogi we'll use app.use()

app.use(express.json({limit : "16kb"}))

app.use(express.urlencoded({extended : true, limit : "16kb"})) // agar kisi url se data uthaana hai

app.use(express.static("public"))

app.use(cookieParser())
 

//routes import

import userRouter from './routes/user.routes.js'
//agar ham ne user.router.js mai router ko export default kiya tha tabhi hum app.js mai apne marzi ke naam se import kara sakte hai

 //routes declaration
 app.use("/api/v1/users", userRouter) //jaise hi koi user "/users" vaale route pe jaega to control userRouter ko mil jaega
// http://localhost:8000/api/v1/users/register   ("/users" tak prefix hai jo ki fixed rahega, app.use() mai 2nd parameter is userRouter, to ab userRouter mai jo bhi route hoga vo "/users" ke aage add ho jaega fir hum us route pe chale jaenge)
//api/v1 -> version 1 of api


export {app}
