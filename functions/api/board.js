const admin = require('firebase-admin');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
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
};

router.post('/createBoard',async (req,res)=>{
    let data = {
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
    try {
        /*
            player1_board_test : "1234",
            player2_board_test : "5678"
        */
        await db.collection("board").doc("1234").set(data)
        await db.collection("board").doc("5678").set(data)
        return res.json({
            status:"success",
            message:"create board success."
        })
    } catch (error) {
        return res.json({
            status:"success",
            message:"create board success."
        })
    }   
})

router.post('/updateBoard',(req,res)=>{

    let data = {}

    if(req.body.role === 'player1'){
        data = {
            player1deck:req.body.deck,
            player1backrow:req.body.backrow,
            player1checkzone:req.body.checkzone,
            player1climaxzone:req.body.climaxzone,
            player1clock:req.body.clock,
            player1frontrow:req.body.frontrow,
            player1hand:req.body.hand,
            player1level:req.body.level,
            player1memory:req.body.memory,
            player1stock:req.body.stock,
            player1waitingroom:req.body.waitingroom
        }
    }else{
        data = {
            player2deck:req.body.deck,
            player2backrow:req.body.backrow,
            player2checkzone:req.body.checkzone,
            player2climaxzone:req.body.climaxzone,
            player2clock:req.body.clock,
            player2frontrow:req.body.frontrow,
            player2hand:req.body.hand,
            player2level:req.body.level,
            player2memory:req.body.memory,
            player2stock:req.body.stock,
            player2waitingroom:req.body.waitingroom
        }
    }
    db.collection('board').doc('1234').update(data)
    .then(function() {
        return res.json({
            status:"success",
            message:"Update board success."
        })
    })
    .catch(function(error) {
        return res.json({
            status:"fail",
            message:"Update board fail.",
            error
        })
    })
})

router.post('/getBoardById',(req,res)=>{
    let BoardId = req.body.BoardId
    db.collection("board").doc(BoardId).get()
    .then(function(querySnapshot) {
        let BoardInfo = querySnapshot.data()
        return res.json({
            status:"success",
            message:"get board by id success",
            BoardInfo
        })
    })
    .catch(function(error) {
        return res.json({
            status:"fail",
            message:"get board by id fail",
            error
        })
    });
})

router.post('/prepareBoard', async (req, res) => {
    /**
        request:{
            deckId, userId
        }
     */
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    if(Object.keys(decoded).length !== 0){
        //getUserDeck
        /*
            userDeck:[
                {
                    cardUrl, cardText
                }
            ]
        */
       try {
            let userDeck = []; 
            let doc = await db.collection('deck').doc(req.body.deckId).get(); // ได้ deck มาแล้ว
            let cardIds = doc.data()['CardIdList'].map(item => item.CardId); // เอาแค่ list ของการ์ดใน deck
            let cardData = {};
            /*
                cardData:{
                    มีทุกอย่างของ card แต่เราต้องการแค่ cardUrl, cardText
                }
            */
            for(let i = 0; i < cardIds.length; i++){
                let snapShot = await db.collection('card').where('CardId', '==', cardIds[i]).get();
                cardData[cardIds[i]] = snapShot.docs[0].data();
            }
            let cardList = doc.data()['CardIdList']; // มีทั้ง CardId และ count
            for(let i = 0; i < cardList.length; i++){
                for(let j = 0; j < cardList[i].count; j++){
                    userDeck.push({
                        url:cardData[cardList[i].CardId]['cardUrl'],
                        text:cardData[cardList[i].CardId]['text'],
                    });
                }
            }
            //get opponentId by invite collection
            let invite = await db.collection('invite').doc(decoded.userId).get();
            let opponentId = invite.data()['invited'];
            //create empty board
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
            await db.collection("board").doc(decoded.userId).set(emptyBoard);
            //delete invite by userId
            await db.collection('invite').doc(decoded.userId).delete();
            return res.json({
                status:'success',
                message:'prepare board success',
                userDeck,
                userId:decoded.userId,
                opponentId
            });
       } catch (error) {
            console.log(error);
            return res.json({
                status:'fail',
                message:'something wrong, try again later',
                error,
            })
       }
    }
    return res.json({
        status:'fail',
        message:'no user in database',
    })
})

router.post('/prepareInvitedBoard', async (req, res) => {
    let bearerHeader = req.headers['authorization'];
    let token = bearerHeader.split(' ')[1];
    //verify token
    let decoded = verifytoken(token);
    if(Object.keys(decoded).length !== 0){
        //เตรียมเด็ค
        let userDeck = []; 
        let doc = await db.collection('deck').doc(req.body.deckId).get(); // ได้ deck มาแล้ว
        let cardIds = doc.data()['CardIdList'].map(item => item.CardId); // เอาแค่ list ของการ์ดใน deck
        let cardData = {};
        for(let i = 0; i < cardIds.length; i++){
            let snapShot = await db.collection('card').where('CardId', '==', cardIds[i]).get();
            cardData[cardIds[i]] = snapShot.docs[0].data();
        }
        let cardList = doc.data()['CardIdList']; // มีทั้ง CardId และ count
        for(let i = 0; i < cardList.length; i++){
            for(let j = 0; j < cardList[i].count; j++){
                userDeck.push({
                    url:cardData[cardList[i].CardId]['cardUrl'],
                    text:cardData[cardList[i].CardId]['text'],
                });
            }
        }
        //create empty board
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
        await db.collection("board").doc(decoded.userId).set(emptyBoard);
        return res.json({
            status:'success',
            message:'prepare invite board success',
            userDeck,
            userId:decoded.userId,
        });
    }
    return res.json({
        status:'fail',
        message:'no user in database',
    })
})

module.exports = router