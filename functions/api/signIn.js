const admin = require('firebase-admin');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
            //return token to user
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

module.exports = router;