const admin = require('firebase-admin')
const express = require('express')

const router = express.Router()
const db = admin.firestore()

router.get('/getAllSeries', async (req, res) => {
    try {
        let doc = await db.collection('series').get();
        if(!doc.empty){
            let series = [];
            doc.forEach(item => {
                series.push(item.data());
            })
            return res.json({
                status:'success',
                message:'get series success',
                series
            })
        }
    } catch (error) {
        console.log(error);
        return res.json({
            status:'fail',
            message:'get series fail',
            error
        })
    }
    return res.json({
        status:'fail',
        message:'get series fail, empty series'
    })
});

router.post('/addSeries', async (req, res) => {
    let seriesName = req.body.seriesName;
    let seriesImage = req.body.seriesImage;
    try {
        await db.collection('series').add({
            seriesName,
            seriesImage
        })
        return res.json({
            status:'success',
            message:'add new series success'
        })
    } catch (error) {
        console.log(error);
        return res.json({
            status:'fail',
            message:'add new series fail',
            error
        })
    }
})

module.exports = router;