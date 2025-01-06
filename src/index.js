//
import dotenv from "dotenv"
import connectDb from "./db/index.js"

dotenv.config({
    path: './.env'
})

connectDb()


// import {DB_NAME} from "./constants"
// import express from "express"
// const app = express()

// ( async () => {     //IIFE
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}`)
//         app.on("error",(error)=>{
//             console.log("ERROR : ",error);
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on Port ${process.env.PORT}`)
//         })
//     }
//     catch(error){
//         console.error("ERROR :",error)
//         throw err
//     }
// } )() 
