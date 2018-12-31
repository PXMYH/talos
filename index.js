'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

app.post('/webhook', (req, resp) => {

  let body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
    });

    // Returns a '200 OK' response to all requests
    resp.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    resp.sendStatus(404);
  }
});

app.get('/webhook', (req, resp) => {
  let VERIFICATION_TOKEN = "thwerwehkjhsdfkhsdfkjsd"

  let mode = req.query['hub.mode'];
  let token = req.query['hub.verification_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {

    if (mode === 'subscribe' && token === VERIFICATION_TOKEN) {
      console.log('Verification Successful!');
      resp.status(200).send(challenge)
    } else {
      resp.sendStatus(403)
    }
  }
});