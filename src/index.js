//
import dotenv from "dotenv"
import connectDb from "./db/index.js"
import {app} from "./app.js"
dotenv.config({
    path: './.env'
})

connectDb() //since there is async await with this function, so whenever there is async await await then the function always returns a promise so you can use .then() and .catch() methods with it
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed ",err)
})


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
