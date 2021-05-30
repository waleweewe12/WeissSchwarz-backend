const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
    credentials:true,
    origin:'http://localhost:3000'
}));
admin.initializeApp();

const cardRouter = require('./api/card');
const deckRouter = require('./api/deck');
const boardRouter = require('./api/board');
const signInRouter = require('./api/signIn');
const registerRouter = require('./api/register');
const sereisRouter = require('./api/series');
const userRouter = require('./api/user');
const inviteRouter = require('./api/invite');

app.use('/card',cardRouter);
app.use('/deck',deckRouter);
app.use('/board',boardRouter);
app.use('/signIn', signInRouter);
app.use('/register',registerRouter);
app.use('/series', sereisRouter);
app.use('/user', userRouter);
app.use('/invite', inviteRouter);

exports.app = functions.https.onRequest(app);
