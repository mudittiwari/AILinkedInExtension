const express = require("express");
const cors = require("cors");
require('dotenv').config()
const app = express();
const token=process.env.CLOUDFLARE_TOKEN
const userId=process.env.CLOUDFLARE_USERID
app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.use(express.json())

app.post("/prompt", async(req, res) => {
  const promptMessage = req.body.prompt;
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${userId}/ai/run/@cf/meta/llama-2-7b-chat-int8`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ prompt: promptMessage }),
  });
  if (response.ok) {
    const data = await response.json();
    return res.status(200).json({"message":data.result.response});
  } else {
    return res.status(400).json({"message":"some error occoured"});
  }
});
app.listen(5000, () => {
  console.log("app running on port 5000");
});