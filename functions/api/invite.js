const admin = require('firebase-admin');
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router()
const db = admin.firestore()

function verifytoken(token){
    try {
        let decoded = jwt.verify(token, 'W31S5sCHwA2Z');
        return decoded;
    } catch (error) {
        console.log(error);
        return {};
    }
}

router.post('/addInvite', async (req, res) => {
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    if(Object.keys(decoded).length !== 0){
        try {
            let doc = await db.collection('user').doc(decoded.userId).get();
            let inviteData = {
                invite:decoded.userId, // id คนเชิญ
                inviteName: doc.data().username, // username คนเชิญ
                invited:req.body.friendId,
                status:'waiting',
            };
            await db.collection('invite').doc(decoded.userId).set(inviteData);
            return res.json({
                status:'success',
                message:'invite success',
            })
        } catch (error) {
            console.log(error);
            return res.json({
                status:'fail',
                message:'something wrong, try again later',
            })
        }
    }else{
        return res.json({
            status:'fail',
            message:'user not signIn',
        });
    }
});

router.post('/deleteInvite', async (req, res) => {
    try {
        await db.collection('invite').doc(req.body.userId).delete();
        return res.json({
            status:'success',
            message:'delete invite success',
        });
    } catch (error) {
        console.log(error);
        return res.json({
            status:'fail',
            message:'something wrong, try again later',
        });
    }
});

router.post('/getInvite', async (req, res) => {
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    if(Object.keys(decoded).length !== 0){
        try {
            let snapShot = await db.collection('invite').where('invited', '==', decoded.userId).get();
            let invite = [];
            snapShot.forEach((doc) => {
                invite.push({
                    userId:doc.id,
                    username:doc.data()['username'],
                });
            });
            return res.json({
                status:'success',
                message:'get invited success',
                userId:decoded.userId,
                invite,
            });
        } catch (error) {
            return res.json({
                status:'fail',
                message:'something wrong, try again later',
                error,
            })    
        }
    }else{
        return res.json({
            status:'fail',
            message:'no user in database',
        })  
    }
})

router.post('/acceptedInvited', async (req, res) => {
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    //token is valid
    if(Object.keys(decoded).length !== 0){
        try {
            //get deck by userId
            let querySnapshot = await db.collection("deck").where("UserId","==",decoded.userId).get();
            let deck = [];
            querySnapshot.forEach(function(doc) {
                deck.push(doc.data());
            });
            //accept invite
            await db.collection('invite').doc(req.body.inviteId).update({ status:'accepted' });
            return res.json({
                status:"success",
                message:"get deck success",
                deck,
            })
        } catch (error) {
            return res.json({
                status:"fail",
                message:"get deck fail",
                error
            })
        }
    }
    return res.json({
        status:"fail",
        message:"token is invalid",
    })
})

module.exports = router;