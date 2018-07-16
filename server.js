// Dependencies
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");
var cheerio = require("cheerio");
var request = require("request");
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Morgan logger for logging requests
app.use(logger("dev"));
// Body-parser for handling form submissions - middlewear for JSON
app.use(bodyParser.urlencoded({ extended: true }));

// Set up Handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

//Connect to Mongo/Mongoose db
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

var mondb = mongoose.connection;
mondb.on('error', function (err) {
  console.log('Mongoose Error: ', err);
});

mondb.once('open', function () {
  console.log('Mongoose Connection Successful.')
})

//Keeping routes in the server
app.get('/', function (req, res) {
  res.render('index');
});

// Make request to grab the HTML from adventure website -- with a good internet connection, the summaries come through easily. I have had trouble with a poor connection. 
app.get("/scrape", function (req, res) {
  console.log("Starting to scrape");
  request("https://www.vacation.com/adventures-events", function (error, response, html) {
      var $ = cheerio.load(html);

      // Then, we load that into cheerio and save it to $ for a shorthand selector
      // Now, we grab every title with a.title.card-link, and do the following:
      $("a.title.card-link").each(function (i, element) {
        var result = {};

          // Had to add the https:// to the link to make a usable link
          result.title = $(this).text();
          result.link = "https://www.vacation.com" + $(this).attr("href");
          result.summary = $(this).siblings("p").text();
        
              db.Article.create(result)
                  .then(function (dbArticle) {
                      console.log(dbArticle);
                  })
                  .catch(function (err) {
                      return res.json(err);
                  });
          });
      res.send("The scrape is complete");
  });
});


// Route for getting articles and sending to the front end via index handlebars 
app.get("/articles", function (req, res) {
  db.Article.find({})
      .populate("note")
      .then(function (dbArticle) {
          res.render("index", { articles: dbArticle });
      })
      .catch(function (err) {
          res.json(err);
      });
});

// Route for populating articles with a user note
app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
      .populate("note")
      .then(function (dbArticle) {
          // console.log(dbArticle);
          res.render("index", { note: dbArticle });
      })
      .catch(function (err) {
          res.json(err);
      });
});

// Route for saving note
app.post("/articles/:id", function (req, res) {
  // Creating a new note (I can't get a new note to not overwrite the previous note)
  db.Note.create(req.body)
      .then(function (dbNote) {
          return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function (dbArticle) {
          res.json(dbArticle);
      })
      .catch(function (err) {
          res.json(err);
      });
});

// Route for deleting the note 
app.get("/notes/delete/:id", function (req, res) {
  db.Note.findOneAndRemove({ _id: req.params.id })
      .then(function (dbNote) {
          res.status(200).send('Deleted');
      })
      .catch(function (err) {
          res.json(err);
      });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});