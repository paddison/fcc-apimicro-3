'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require("dns");

var cors = require('cors');
const { url } = require('inspector');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

process.env.DB_URI=("mongodb+srv://paddison:sevenfl4tseven@cluster0-8ckny.mongodb.net/paddison?retryWrites=true&w=majority")

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI, 
  { useNewUrlParser: true, useUnifiedTopology: true }, 
  () => console.log("Connected")
);

var Schema = mongoose.Schema;

var urlSchema = new Schema({
  "original_url": String,
  "short_url": Number
});
var Url = mongoose.model("Url", urlSchema);

var incrementSchema = new Schema({
  _id: String,
  count: Number
});
var Increment = mongoose.model("Increment", incrementSchema);

// reset database for testing
/*
Increment.deleteMany({}, err => {
  if (err) throw err;
});

Url.deleteMany({}, err => {
  if (err) throw err;
});
*/

Increment.findById("item_id", (err, data) => {
  if (err) throw err;
  if (!data) {
    var counter = new Increment({_id: "item_id", count: 0})
    counter.save((err, data) => {
      if (err) throw err;
      console.log("Counter created");
    });
  }else {
    console.log("Counter is: " + data.count);
  }
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const replaceRegex = /^https?:\/\//i  

// your first API endpoint... 
app.post("/api/shorturl/new", function (req, res, next) {
  var parsedUrl = req.body.url.replace(replaceRegex, "").split("/");
  dns.lookup(parsedUrl[0], (err) => {
    if (err) {
      res.json({"error": "invalid URL"});
    } else {
      Url.findOne({"original_url": req.body.url}, (err, data) => {
        if (err) throw err;
        if (!data) {
          Increment.findById("item_id", (err, data) => {                      
            data.count++;
            data.save((err, data) => {
              if (err) throw err;
            });
            const newUrl = new Url({"original_url": req.body.url, "short_url": data.count});
            newUrl.save((err, data) => {
              if (err) throw err;
              console.log(data.original_url + " added to database");
              res.json({"original_url": data.original_url, "short_url": data.short_url});
            });
          }); 
        } else {
          console.log(data.original_url + " already in database");
          res.json({"original_url": data.original_url, "short_url": data.short_url});
        }
      });
    }; 
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  Url.findOne({"short_url": req.params.id}, (err, data) => {
    if (err) throw err;
    if (!data) {
      console.log("URL not found")
      res.json({"error": "no website found for id " + req.params.id});
    } else {
      console.log("redirected to " + data.original_url);
      res.redirect(data.original_url);
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening to ' + port);
});