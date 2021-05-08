const admin = require('firebase-admin');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const router = express.Router()
const db = admin.firestore()

async function getUserByUsername(username){
    try {
        let snapshot = await db.collection('user').where('username', '==', username).get();
        let user = {};
        snapshot.forEach(doc => {
            user = doc.data();
        })
        return user;
    } catch (error) {
        console.log(error)
    }
    return {};
}

async function verifyPassword(plaintextPassword, hashPassword){
    let result = false;
    try {
        result = await bcrypt.compare(plaintextPassword, hashPassword);
    }catch (error) {
        console.log(error);
    }
    return result;
}

async function saveSignInKey(userId, signInKey){
    try {
        db.collection('signIn').doc(userId).set({
            signInKey
        });
    } catch (error) {
        console.log(error);
        throw error;
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

async function SendMail(reciver, id){
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
        text:"Click this link to reset your password : " +
            "http://localhost:5000/weissschwarz-f48e0/us-central1/app/signin/reset/" + id
    }
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        throw error;
    }
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

router.post('/', async (req, res) => {
    let username = req.body.username;
    let plaintextPassword = req.body.password;
    let user = await getUserByUsername(username);
    //found user in database
    if(Object.keys(user).length !== 0){
        let verified = await verifyPassword(plaintextPassword, user.password);
        //password is correct
        if(verified){
            //create signInKey
            let signInKey = uuidv4();
            //create token
            let token = jwt.sign(
                {
                    userId:user.userId,
                    username:user.username,
                    email:user.email,
                    signInKey
                }, 
                'W31S5sCHwA2Z', 
                { 
                    expiresIn: 60 * 60 
                }
            );
            //save SignInKey in database
            await saveSignInKey(user.userId, signInKey);
            //set token in user cookie
            /*
                Notes: firebase ไม่สามารถอ่าน cookie ได้
                res.cookie('__session', token, {
                    httpOnly:true,
                    maxAge:360000,
                    signed: false,
                    secure:false 
                })
            */
            //return token to user, user keep this token in localStorage
            return res.json({
                status:'success',
                message:'get user success',
                token
            });
        }
        return res.json({
            status:'fail',
            message:'get user fail'
        });
    }
    //not found username in database
    return res.json({
        status:'fail',
        message:'no user in database',
    });
});

router.post('/auth', async (req, res) => {
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    let data = verifyToken(token);
    if(data.message !== 'fail'){
        try {
            let doc = await db.collection('signIn').doc(data.decoded.userId).get();
            let signInKey = doc.data().signInKey;
            if(signInKey === data.decoded.signInKey){
                return res.json({
                    status:'success',
                    message:'auth success',
                });
            } 
        } catch (error) {
            console.log(error);
        }
    }
    return res.json({
        status:'fail',
        message:'auth fail',
    });
});

router.post('/reset', async (req, res) => {
    let email = req.body.email;
    if(email !== undefined && email !== ''){
        try {
            let id = uuidv4();
            await db.collection('resetPassword').doc(id).set({ email });
            await SendMail(email, id);
            return res.json({
                status:'success',
                message:'request success, please verify your email',
            })
        } catch (error) {
            console.log(error);
            return res.json({
                status:'fail',
                message:'request fail, somethng wrong please try again later',
            })
        }
    }
    return res.json({
        status:'fail',
        message:'please enter your email',
    })
})

router.get('/reset/:id', async (req, res) => {
    let id = req.params.id;
    try {
        const doc = await db.collection('resetPassword').doc(id).get();
        if(doc.exists){
            let email = doc.data().email;
            const user = await db.collection('user').where('email', '==', email).get();
            if(user.empty){
                return res.redirect('http://localhost:3000/resetpassword/fail');
            }
            return res.redirect('http://localhost:3000/resetpassword/success/' + id);
        }else{
            return res.redirect('http://localhost:3000/resetpassword/fail');
        }
    } catch (error) {
        console.log(error);
        return res.redirect('http://localhost:3000/resetpassword/fail');
    }
})

router.post('/changePassword', async (req, res) => {
    let id = req.body.id;
    try {
        let password = await EncryptPassword(req.body.password);
        const doc = await db.collection('resetPassword').doc(id).get();
        if(doc.exists){
            let email = doc.data().email;
            const user = await db.collection('user').where('email', '==', email).get();
            if(!user.empty){
                let userId = {};
                user.forEach(item => {
                    userId = item.id;
                })
                await db.collection('user').doc(userId).update({ password:password });
                //delete id after password had reset
                await db.collection('resetPassword').doc(id).delete();
                return res.json({
                    status:'success',
                    message:'password changed'
                })
            }
            return res.json({
                status:'fail',
                message:'this email is unregister'
            })
        }
        return res.json({
            status:'fail',
            message:'no resetPassword request in database'
        })
    } catch (error) {
        console.log(error);
        return res.json({
            status:'fail',
            message:'something wrong, please try again later'
        })
    }
})

module.exports = router;