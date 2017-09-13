// express_server.js
// declare requirements
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const generateRandom = require("./generateRandom.js");
const urlsDB = require("./urlsDB.js");
const usersDB = require("./usersDB.js");

// declare constants
const PORT = process.env.PORT || 8080; // default port 8080
const SHORTLEN = 6;
const USERIDLEN = 6;

// setup express and requirements
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.end("Hello!");
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsDB.getAll(),
    user: usersDB.get(req.cookies.user)
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: usersDB.get(req.cookies.user) };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const newShortURL = generateRandom.string(SHORTLEN);
  if (urlsDB.add(newShortURL, req.body.longURL)) {
    res.status(201);
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.status(500).send('500 - There was an error on our end. Oops! Please try again.');
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    fullURL: urlsDB.get(req.params.id),
    user: usersDB.get(req.cookies.user)
  };
  res.render("urls_show", templateVars);
});

app.delete("/urls/:id", (req, res) => {
  if (urlsDB.delete(req.params.id)) {
    res.status(200);
    res.redirect("/urls");
  } else {
    res.status(404).send('404 - Could not remove item. Item was not found.');
  }
});

app.put("/urls/:id", (req, res) => {
  if (urlsDB.edit(req.params.id, req.body.fullURL)) {
    res.status(200);
    res.redirect("/urls");
  } else {
    res.status(404).send('404 - Could not modify item. Item was not found.');
  }
});

app.get("/u/:shortURL", (req, res) => {
  // gets longURL base on ':shortURL' route and key in urlDatabase
  if (urlsDB.get(req.params.shortURL)) {
    res.status(302);
    res.redirect(urlsDB.get(req.params.shortURL)); // redirects the page to the longURL
  } else {
    res.status(404).send('404 - URL not found!');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    const existingUsers = usersDB.getAll();
    let emailExists = false;
    for (key in existingUsers) {
      if (existingUsers[key].email === req.body.email) { // checks if email exists already
        emailExists = true;
      }
    }
    if (!emailExists) {
      const userID = generateRandom.string(USERIDLEN)
      const user = {
        id: userID,
        email: req.body.email,
        password: req.body.password
      }
      if (usersDB.add(userID, user)) {
        res.status(201);
        res.cookie('user', userID);
        res.redirect("/urls");
      } else {
        res.status(500).send("500 - There was an error on our end. Oops! Please try again.");
      }
    } else {
      res.status(400).send("400 - Bad Request. Email is already registered.")
    }
  } else {
    res.status(400).send("400 - Bad Request. You must enter both an email and password.");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  if (req.body.email && req.body.password) {
    const user = usersDB.getByEmail(req.body.email);
    if (user) {
      if (user.password === req.body.password) {
        res.status(200);
        res.cookie('user', user.id);
        res.redirect("/urls");
      } else {
        res.status(401).send("401 - Login failed");
      }
    } else {
      res.status(404).send("404 - User not found.");
    }
  } else {
    res.status(400).send("400 - Bad Request. You must enter both an email and password.");
  }
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});