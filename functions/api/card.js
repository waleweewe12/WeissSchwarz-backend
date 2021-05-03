const admin = require('firebase-admin')
const express = require('express')

const router = express.Router()
const db = admin.firestore()

//Create
router.post('/addCard',(req,res)=>{

    let data = {
        series:req.body.series,
        name:req.body.name,
        text:(req.body.text).split("\n"),
        level:req.body.level,
        cost:req.body.cost,
        counter:req.body.counter,
        trigger:req.body.trigger,
        color:req.body.color,
        power:req.body.power,
        soul:req.body.soul,
        CharacterType:req.body.CharacterType ? (req.body.CharacterType).split("\n"):null, //i.e. <Animal>, <weapon>
        CardType:req.body.CardType, // i.e. Climax, Character, Event
        CardId:req.body.CardId
    }
    db.collection("card").doc().set(data)
    .then(function() {
        return res.json({
            status:"success",
            message:"Add card success."
        })
    })
    .catch(function(error) {
        return res.json({
            status:"fail",
            message:"Add card fail.",
            error
        })
    })
})

//Read
router.post('/getCard',(req,res)=>{
    db.collection("card").where("CardId","==",req.body.CardId)
    .get()
    .then(function(querySnapshot) {
        let card = []
        querySnapshot.forEach(function(doc) {
            card.push(doc.data())
        });
        return res.json({
            status:"success",
            message:"get card success",
            card
        })
    })
    .catch(function(error) {
        return res.json({
            status:"fail",
            message:"get card fail",
            error
        })
    });
})

router.post('/getCardBySeries',(req,res)=>{
    db.collection('card').where('series','==',req.body.series)
    .get()
    .then(function(querySnapshot) {
        let card = []
        querySnapshot.forEach(function(doc) {
            card.push(doc.data())
        });
        return res.json({
            status:"success",
            message:"get card success",
            card
        })
    })
    .catch(function(error) {
        return res.json({
            status:"fail",
            message:"get card fail",
            error
        })
    })
})

//Update
router.get('/getCardId', async (req, res)=>{
    try {
        let allCards = await db.collection('card').get();
        let cardIds = [];
        allCards.forEach(doc => {
            cardIds.push({
                id:doc.id,
                cardName:doc.data().name,
                series:doc.data().series
            });
        })
        return res.json({
            cardIds
        });
    } catch (error) {
        throw error;
    }
})

//Delete
router.post('/deleteCard',(req,res)=>{

})

module.exports = router