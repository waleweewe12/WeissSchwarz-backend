const admin = require('firebase-admin')
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const router = express.Router()
router.use(cors());
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

router.get('/',(req,res)=>{
    res.json({message:'testtt'})
})
//Create
router.post('/addDeck',(req,res)=>{
    /*
    Example CardList
    CardIdList:[
        {
            CardId:'KS/W76-071 CR',
            count:4
        }
    ]
     */
    let randomId = uuidv4();
    let data = {
        CardIdList:req.body.cardIdList,
        DeckId:randomId,
        UserId:req.body.userId,
        DeckImage:req.body.deckImage,
        DeckName:req.body.deckName
    };
    db.collection("deck").doc(randomId).set(data)
    .then(function() {
        return res.json({
            status:"success",
            message:"Add deck success."
        })
    })
    .catch(function(error) {
        return res.json({
            status:"fail",
            message:"Add deck fail.",
            error
        })
    })
})
//Update
router.post('/updateDeck',(req,res)=>{
    let data = {
        CardIdList:req.body.CardIdList,
        DeckId:req.body.DeckId
    }
    db.collection("deck").doc(req.body.DeckId).set(data)
    .then(function() {
        return res.json({
            status:"success",
            message:"update deck success."
        })
    })
    .catch(function(error) {
        return res.json({
            status:"fail",
            message:"update deck fail.",
            error
        })
    })
})
//Read
router.post('/getDeck',async (req,res)=>{
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    //token is valid
    if(Object.keys(decoded).length !== 0){
        try {
            let querySnapshot = await db.collection("deck").where("UserId","==",decoded.userId).get()
            let deck = [];
            querySnapshot.forEach(function(doc) {
                deck.push(doc.data());
            });
            return res.json({
                status:"success",
                message:"get deck success",
                deck
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

router.get('/getDeckByDeckId/:deckId', async (req, res) => {
    let deckId = req.params.deckId;
    try {
        let doc = await db.collection('deck').doc(deckId).get();
        return res.json({
            status:'success',
            message:'get deck by deckId success',
            deck:doc.data(),
        })
    } catch (error) {
        console.log(error);
        return res.json({
            status:'fail',
            message:'get deck by deckId fail',
        })
    }
});

module.exports = router;