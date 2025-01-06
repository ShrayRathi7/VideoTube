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
 



export {app}
