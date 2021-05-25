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

router.post('/getCardByMultipleCardId', async (req, res) => {
    let cardIds = req.body.cardIds;
    let ids = cardIds.map(card => card.CardId);
    let cardData = [];
    //split ids 
    let idsSplit = []
    for(let i = 0; i < parseInt(ids.length / 10); i += 10){
        idsSplit.push(ids.slice(i, i + 10));
    }
    idsSplit.push(ids.slice( parseInt(ids.length / 10) * 10, parseInt(ids.length / 10) * 10 + ids.length % 10 ));
    //console.log(idsSplit);
    try {
        // Notes: query 'IN' in firestore limit up to 10 
        for(let i = 0; i < idsSplit.length; i++){
            let snapShot = await db.collection('card').where('CardId', 'in', idsSplit[i]).get();
            snapShot.forEach((doc) => {
                let cardInDeck = cardIds.find(card => card.CardId === doc.data().CardId);
                let cardTemp = doc.data();
                cardTemp['count'] = cardInDeck['count'];
                cardData.push(cardTemp);
            });
        }
        return res.json({
            status:'success',
            message:'get card by multiple id success',
            cardData
        })
    } catch (error) {
        console.log(error);
        return res.json({
            status:'fail',
            message:'get card by multiple id fail',
            error
        })
    }
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

router.get('/getCardBySeriesName/:name', async (req, res) => {
    const name = req.params.name;
    try {
        let doc = await db.collection('card').where('series', '==', name).get();
        if(!doc.empty){
            let cards = [];
            doc.forEach(item => {
                cards.push(item.data());
            });
            return res.json({
                status:'success',
                message:'get card by series success',
                cards
            });
        }
    } catch (error) {
        console.log(error);
    }
    return res.json({
        status:'fail',
        message:'get card by sereis fail'
    });
});

module.exports = router