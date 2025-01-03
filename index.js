require('dotenv').config()

const express = require('express')

const app = express() //express ki saari functionalities ab 'app' ke paas hai

const port = 2000 //There are approx 65000 virtual ports.Basically port vo jagah hai jha par hamara server listen karega

app.get('/',(req,res)=>{
    res.send('Hello World')
})

app.get('/twitter',(req,res)=>{
    res.send('Shray.7')
})

app.get('/login',(req,res)=>{
    res.send('<h1>Nvidia it is</h1>')
})




app.get('/youtube',(req,res)=>{
    res.send('<h2>Kaede mai rahiye chotte nhi to gaand pe padenge sotte</h2>')
})

app.listen(process.env.PORT,()=>{
    console.log(`Example app listening at port ${port}`)
})