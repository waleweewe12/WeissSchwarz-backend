const admin = require('firebase-admin')
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');

const router = express.Router()
const db = admin.firestore()

async function SendMail(reciver, token){
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
        text:"Thank you for register. Please click this link to verify your account : " +
            "http://localhost:5000/weissschwarz-f48e0/us-central1/app/register/verify/" + 
            token
    }
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        throw error;
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

function verifyToken(token){
    try {
        let decoded = jwt.verify(token, 'W31S5sCHwA2Z');
        return {
            message:'success',
            decoded,
        };
    } catch (error) {
        return {
            message:'fail',
            error,
        };
    }
}

router.post('/',async (req,res)=>{
    let email = req.body.email
    let username = req.body.username
    let password = req.body.password

    try {
        let usernamechecked = []
        let usernameResponse = await db.collection("user").where("username","==",username).get()
        usernameResponse.forEach(item => usernamechecked.push(item.data()))
        usernameResponse = await db.collection("register").where("username","==",username).get()
        usernameResponse.forEach(item => usernamechecked.push(item.data()))
        //check existed username
        if(usernamechecked.length === 0){
            let emailchecked = []
            let emailResponse = await db.collection("user").where("email","==",email).get()
            emailResponse.forEach(item=>emailchecked.push(item.data()));
            emailResponse = await db.collection("register").where("email", "==", email).get()
            emailResponse.forEach(item=>emailchecked.push(item.data()));
            //check existed email
            if(emailchecked.length === 0){
                //check corrected password
                if(CheckPlaintextPassword(password)){
                    hash = await EncryptPassword(password)
                    //check create hash successed
                    if(hash !== password){
                        let data = {
                            email,
                            username,
                            password:hash,
                            userId:uuidv4()
                        }
                        //send email verification
                        try {
                            await db.collection('register').doc(data.userId).set(data);
                            let token = jwt.sign(data, 'W31S5sCHwA2Z', { expiresIn: 60 * 60 });
                            await SendMail(data.email, token);
                            return res.json({
                                status:"success",
                                message:"save new user in database"
                            })
                        } catch (error) {
                            console.log(error);
                            throw error;
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

router.get('/verify/:token', async (req, res) =>{
    let token = req.params.token;
    let data = verifyToken(token);
    if(data.message !== 'fail'){
        try{
            //check token is in firestore ?
            const doc = await db.collection('register').doc(data.decoded.userId).get();
            if(!doc.exists){
                return res.redirect('http://localhost:3000/register/fail');
            }
            //save new user in database
            await db.collection("user").doc(data.decoded.userId).set({
                email:data.decoded.email,
                password:data.decoded.password,
                userId:data.decoded.userId,
                username:data.decoded.username
            })
            //create private board for new user
            let emptyBoard = {
                deck:[],
                backrow:['empty_card.jpg','empty_card.jpg'],
                checkzone:[],
                climaxzone:[],
                clock:['empty_card.jpg','empty_card.jpg','empty_card.jpg','empty_card.jpg','empty_card.jpg','empty_card.jpg'],
                frontrow:['empty_card.jpg','empty_card.jpg','empty_card.jpg'],
                hand:[],
                level:[],
                memory:[],
                stock:[],
                waitingroom:[]
            }
            await db.collection('board').doc(data.decoded.userId).set(emptyBoard);
            //delete token in register
            await db.collection('register').doc(data.decoded.userId).delete();
            return res.redirect('http://localhost:3000/register/success');
        }catch(error){
            return res.json({
                status:"fail",
                message:"error on save user in database"
            })
        }
    }
    return res.redirect('http://localhost:3000/register/fail');
})

module.exports = router