const express = require("express");
const mongoose = require("mongoose");
const ShortUniqueId = require('short-unique-id');
const bodyParser = require("body-parser")

const app = express();
const PORT = 10000;


app.use(bodyParser.json());

app.use((req, res, next) => {
  let logData = `${new Date().toISOString()} | ${req.url} | ${req.method}`
  console.log(logData);
  next();
})

const { connectDB } = require("./db")


connectDB();
const Url = require("./models/urlmodel");

app.get("/", (req, res) => {
  res.send("Welcome to Fantastic URL Genie")
})

app.get("/about", (req, res) => {
  res.send("A simple url shortner service created using Express and MongoDB")
})


const isValidUrl = url => {
  const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
  return urlRegex.test(url);
}



app.post('/shorten', async (req, res) => {
  const { fullUrl } = req.body;

  // Basic URL validation (optional)
  if (!isValidUrl(fullUrl)) {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  try {
    const existingUrl = await Url.findOne({ fullUrl });
    if (existingUrl) {
      return res.json({ shortId: existingUrl.shortId });  // Already shortened URL
    }

    // const shortId = shortId.generate();
    const uid = new ShortUniqueId({ length: 10 });
    const shortId = uid.rnd();
    const newUrl = new Url({ fullUrl, shortId });
    await newUrl.save();

    res.json({ shortId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.get('/:shortId', async (req, res) => {
  const shortId = req.params.shortId;

  try {
    const url = await Url.findOne({ shortId });
    if (url) {
      await Url.updateOne({ shortId }, { $inc: { clicks: 1 } });  // Increment clicks (optional)
      return res.redirect(url.fullUrl);
    }

    res.status(404).json({ message: 'Short URL not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT} ...`)
})

