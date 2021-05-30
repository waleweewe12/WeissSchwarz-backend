const admin = require('firebase-admin');
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const db = admin.firestore();

function verifytoken(token){
    try {
        let decoded = jwt.verify(token, 'W31S5sCHwA2Z');
        return decoded;
    } catch (error) {
        console.log(error);
        return {};
    }
}

router.post('/getFriendsByUserId', async (req, res) => {
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    //verify token success
    if(Object.keys(decoded).length !== 0){
        try {
            let doc = await db.collection('user').doc(decoded.userId).get();
            return res.json({
                status:'success',
                message:'get friens by userId success',
                userId:decoded.userId,
                friends:doc.data()['friends'],
            });
        } catch (error) {
            return res.json({
                status:'fail',
                message:'something wrong, try again later',
            });
        }
    }else{
        return res.json({
            status:'fail',
            message:'user is not signIn',
        });
    }
});

router.post('/addFriend', async (req, res) => {
    /*
        request:{
            username (add friends)
        }
    */
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    //verify token success
    if(Object.keys(decoded).length !== 0){
        try {
            //get userData from database
            let doc = await db.collection('user').doc(decoded.userId).get();
            // get field 'friends'
            let friends = doc.data()['friends'];
            //get user who want to add friend
            let snapShot = await db.collection('user').where('username', '==', req.body.username).get();
            if(!snapShot.empty){
                // add friend
                friends.push({
                    username:req.body.username,
                    friendId:(snapShot.docs[0].data()).userId,
                })
                //update frienf to database
                await db.collection('user').doc(decoded.userId).update({ friends:friends });
                return res.json({
                    status:'success',
                    message:'add friend success',
                })
            }else{
                return res.json({
                    status:'fail',
                    message:'user who want to add friend not in database',
                })
            }
        } catch (error) {
            return res.json({
                status:'fail',
                message:'something wrong, try again later',
            })
        }
    }else{
        return res.json({
            status:'fail',
            message:'user is not signIn',
        })
    }
})

module.exports = router;