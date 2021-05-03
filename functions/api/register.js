const admin = require('firebase-admin')
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');

const router = express.Router()
const db = admin.firestore()

async function SendMail(reciver){
    let transporter = nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:"smile69LOR@gmail.com",
            pass:"weeweewee"
        }
    })
    let mailOptions = {
        from:"smile69LOR@gmail.com",
        to:reciver,
        subject:"Verify your account",
        text:"Your verify code is " + 123456
    }
    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        throw error
    }
}


function CheckPlaintextPassword(password){    
    let patterns = [/[A-Z]{1}/g,/[a-z]{1}/g,/[0-9]{1}/g]
    let result = true
    if(password.length < 6)
        return false
    patterns.forEach(patt=>{
      if(password.match(patt) === null){
        result = false
      }
    })
    return result
}

async function EncryptPassword(PlaintextPassword){
    let saltRounds = 10
    try {
        let hash = bcrypt.hash(PlaintextPassword, saltRounds)
        return hash
    } catch (error) {
        return PlaintextPassword
    }
}

router.post('/',async (req,res)=>{
    let email = req.body.email
    let username = req.body.username
    let password = req.body.password

    try {
        let usernameResponse = await db.collection("user").where("username","==",username).get()
        let usernamechecked = []
        usernameResponse.forEach(item => usernamechecked.push(item.data()))
        //check existed username
        if(usernamechecked.length === 0){
            let emailResponse = await db.collection("user").where("email","==",email).get()
            let emailchecked = []
            emailResponse.forEach(item=>emailchecked.push(item.data()))
            //check existed email
            if(emailchecked.length === 0){
                //check corrected password
                if(CheckPlaintextPassword(password)){
                    hash = await EncryptPassword(password)
                    //check create hash successed
                    if(hash !== password){
                        password = hash
                        let userId = uuidv4()
                        let data = {
                            email,username,password,userId
                        }
                        //save new user in database
                        try{
                            await db.collection("user").doc(userId).set(data)
                            SendMail(data.email)
                            return res.json({
                                status:"success",
                                message:"save new user in database"
                            })
                        }catch(error){
                            return res.json({
                                status:"fail",
                                message:"error on save user in database"
                            })
                        }
                    }else{
                        return res.json({
                            status:"fail",
                            message:"create hash fail"
                        })
                    }
                }else{
                    return res.json({
                        status:"fail",
                        message:"password is incorrect"
                    })
                }
            }else{
                return res.json({
                    status:"fail",
                    message:"this email already existed"
                })
            }
        }else{
            return res.json({
                status:"fail",
                message:"this username already existed"
            })
        }
    
    } catch (error) {
        return res.json({
            status:"fail",
            message:"error on register"
        })
    }
    
})

router.post('/verify/:token', (req, res) =>{

})

module.exports = router