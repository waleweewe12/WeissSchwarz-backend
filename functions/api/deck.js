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
router.post('/addDeck',async (req,res)=>{
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    //token is valid
    if(Object.keys(decoded).length !== 0){
        try {
            //get seriesImage by seriesName
            let snapShot = await db.collection('series').where('seriesName', '==', req.body.seriesName).get();
            if(!snapShot.empty){
                let deckImage = (snapShot.docs[0].data()).seriesImage;
                let randomId = uuidv4();
                let data = {
                    CardIdList:[],
                    DeckId:randomId,
                    UserId:decoded.userId,
                    DeckImage:deckImage,
                    DeckName:req.body.deckName,
                    SeriesName:req.body.seriesName
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
            }else{
                return res.json({
                    status:'fail',
                    message:'no series in database'
                })
            }
        } catch (error) {
            return res.json({
                status:'fail',
                message:'something wrong, try again later'
            })
        }
    }
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

router.post('/addCard', async (req, res) => {
    /*
        request:{
            deckId, cardId
        }
    */
    try {
        //check card is in deck ?
        let doc = await db.collection('deck').doc(req.body.deckId).get();
        if(doc.exists){
            let cardIdList = doc.data()['CardIdList'];
            let check = 0;
            for(let i = 0; i < cardIdList.length; i++){
                if(cardIdList[i].CardId === req.body.cardId){
                    cardIdList[i].count ++;
                    check = 1;
                }
            }
            if(check === 0){
                cardIdList.push({
                    CardId:req.body.cardId,
                    count:1
                })
            }
            // update cardIdList in database
            await db.collection('deck').doc(req.body.deckId).update( { CardIdList:cardIdList } );
            return res.json({
                status:'success',
                message:'add card in deck success'
            });
        }else{
            return res.json({
                status:'fail',
                message:'no deckId in database'
            })
        }
    } catch (error) {
        return res.json({
            status:'fail',
            message:'something wrong, please try again'
        });
    }
})

router.post('/deleteCard', async (req, res) => {
    try {
        //check card is in deck ?
        let doc = await db.collection('deck').doc(req.body.deckId).get();
        if(doc.exists){
            let cardIdList = doc.data()['CardIdList'];
            let check = 0;
            for(let i = 0; i < cardIdList.length; i++){
                if(cardIdList[i].CardId === req.body.cardId){
                    cardIdList[i].count --;
                    check = 1;
                }
            }
            //นำการ์ดที่เหลือน้อยกว่าหรือเท่ากับ 0 ใบ ออก
            cardIdList = cardIdList.filter(card => card.count > 0);
            // update cardIdList in database
            await db.collection('deck').doc(req.body.deckId).update( { CardIdList:cardIdList } );
            return res.json({
                status:'success',
                message:'add card in deck success'
            });
        }else{
            return res.json({
                status:'fail',
                message:'no deckId in database'
            })
        }
    } catch (error) {
        return res.json({
            status:'fail',
            message:'something wrong, please try again'
        });
    }
})

module.exports = router;