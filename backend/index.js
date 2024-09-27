const express = require("express");
const cors = require("cors")
const app = express();
app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.use(express.json())

app.post("/prompt", async(req, res) => {
  const promptMessage = req.body.prompt;
  const response = await fetch('https://api.cloudflare.com/client/v4/accounts/77c5ed683454ca076e50a720e17e3115/ai/run/@cf/google/gemma-7b-it-lora', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer jnBXztEfABPFu_I1h17Px87lTcURfIicjZrLJ9eR'
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