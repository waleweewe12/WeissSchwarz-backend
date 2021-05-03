const admin = require('firebase-admin')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const router = express.Router()
const db = admin.firestore()

router.get('/',(req,res)=>{
    res.json({message:'testtt'})
})

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

module.exports = router