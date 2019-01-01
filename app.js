"use strict";

// Imports dependencies and set up http server
const express = require("express");
const bodyParser = require("body-parser");
const app = express().use(bodyParser.json()); // creates express http server
const request = require("request");

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

app.post("/webhook", (req, resp) => {
  let body = req.body;

  if (body.object === "page") {
    body.entry.forEach(function(entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        // handlePostback(sender_psid, webhook_event.postback);
        handleLocationPostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    resp.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    resp.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
app.get("/webhook", (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "YrvzX5ID1RJiphbBDsYkfpSHIBySw3IR";

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;

  // check if the message contains text
  // if (received_message.text) {
  //   // Create the payload for a basic text message
  //   response = {
  //     text: `You sent the message: "${
  //       received_message.text
  //     }". Now send me an image!`
  //   };
  // } else
  if (received_message.text) {
    console.log(
      "received message: " + received_message.text + " constructing response.."
    );
    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "which city do you want info?",
          buttons: [
            { type: "postback", title: "Toronto", payload: "ca-tor" },
            { type: "postback", title: "Vancouver", payload: "ca-van" },
            { type: "postback", title: "Ottawa", payload: "ca-ott" }
          ]
        }
      }
    };
  } else if (received_message.attachments) {
    // Gets the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;

    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Is this the right picture?",
              subtitle: "Tap a button to answer.",
              image_url: attachment_url,
              buttons: [
                {
                  type: "postback",
                  title: "Yes!",
                  payload: "yes"
                },
                {
                  type: "postback",
                  title: "No!",
                  payload: "no"
                }
              ]
            }
          ]
        }
      }
    };
  }

  // Sends the response message
  callSendAPI(sender_psid, response);
  console.log("[handleMessage] sending response ... ");
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === "yes") {
    response = { text: "Thanks!" };
  } else if (payload === "no") {
    response = { text: "Oops, try sending another image." };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events specifically for location services
function handleLocationPostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === "ca-tor") {
    response = {
      text:
        "Toronto has the highest rent across Canada. Please waiting while our team gathering more detailed information."
    };
  } else if (payload === "ca-van") {
    response = {
      text: "Vancouver is a beautiful city to live in, but, expensive."
    };
  } else if (payload === "ca-ott") {
    response = { text: "Ottawa's housing condition is improving." };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!" + response);
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}
