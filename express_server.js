const express = require("express");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");

//import helper functions
const { getUserByEmail, generateRandomString, urlsForUser } = require("./helpers");

// app setup
const app = express();
const PORT = 8080;

// set ejs as the view engine
app.set("view engine", "ejs");
// middleware that parses incoming requests with URL-encoded payloads and is based on a body parser
app.use(express.urlencoded({ extended: true }));
// middleware to log HTTP requests for my app
app.use(morgan("dev"));
// middleware for signing cookies
app.use(
  cookieSession({
    name: "session",
    keys: ["19jb07tbl"],
  })
);

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "5d63jf" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "5d63jf" },
  k2vVn3: { longURL: "http://www.youtube.com", userID: "8d23jK" },
  "8sX5x5": { longURL: "http://www.netflix.ca", userID: "8d23jK" },
};

const users = {
  "5d63jf": {
    id: "5d63jf",
    email: "test1@example.com",
    password: "test1",
  },
  "8d23jK": {
    id: "8d23jK",
    email: "test2@example.com",
    password: "test2",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

// route for user registration form rendering
app.get("/register", (req, res) => {
  // check if user already logged in by checking if cookie user_id exists
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }

  const userData = users[req.session.user_id];
  const templateVars = { user: userData };
  res.render("register", templateVars);
});

// rout for user registration form that saves the user data in local db and creates a cookie
app.post("/register", (req, res) => {
  // check if email or password were not provided, if not respond with error
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Email and password cannot be blank");
    return;
  }

  // check if user exists in the users DB, if it does respond with an error
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("User already exists");
    return;
  }

  // save the new user to users DB, setup a cookie and redirect to /urls route
  const newId = generateRandomString();
  users[newId] = {
    id: newId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  };

  //set signed cookie of user_id with signed value of newId
  req.session.user_id = newId;
  res.redirect("/urls");
});

// route to render the login page
app.get("/login", (req, res) => {
  //check if user already logged in by checing if cookie user_id already exists
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  // find user's data based on the cookie info
  const userData = users[req.session.user_id];
  const templateVars = { user: userData };
  res.render("login", templateVars);
});

// route to validate the email and password provided in login page
app.post("/login", (req, res) => {
  // set user email and password if they exist, if not set them to null
  const email = req.body.email ? req.body.email : null;
  const password = req.body.password ? req.body.password : null;

  // show error if email and/or passord were not provided
  if (email === null || password === null) {
    res.status(400).send("Please provide email and password");
    return;
  }

  // check if user exists in users DB, if not userData will be null
  const userData = getUserByEmail(email, users);

  // if user doesn't exist respond with error
  if (!userData) {
    res.status(403).send("Email cannot be found");
    return;
  }

  // if user exists but the passwords don't match, return error
  if (!bcrypt.compareSync(password, userData.password)) {
    res.status(403).send("Password does not match for that email account");
    return;
  }

  // set up signed cookie with the user id retrieved from users DB
  req.session.user_id = userData.id;
  res.redirect("/urls");
});

// route for logout functionality, clears the user_id cookie and redirects the user back to the /login page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// route to render all existing URLs on "My URLs" page (urls_index.ejs view)
app.get("/urls", (req, res) => {
  // check if user already logged in, if not respond with error
  if (!req.session.user_id) {
    res.status(401).send("Please login or register to be able to see your shorten URLs");
    return;
  }

  //populate templateVars based on user id
  const userData = users[req.session.user_id];
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { urls: userUrls, user: userData };

  res.render("urls_index", templateVars);
});

// route to save the new URL provided in a form on "New URL" page (urls_new.ejs view)
app.post("/urls", (req, res) => {
  // check if users already logged in, if not respond with an error
  if (!req.session.user_id) {
    res.status(401).send("Please login or register to be able to shorten URL");
    return;
  }
  // add the new url to urlDatabase
  const newId = generateRandomString();
  urlDatabase[newId] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${newId}`);
});

// route to render the "Create TinyURL" page (urls_new.ejs view)
app.get("/urls/new", (req, res) => {
  // check if user already logged in, if not redirect to /login
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }

  const userData = users[req.session.user_id];
  const templateVars = { user: userData };
  res.render("urls_new", templateVars);
});

// route to render the "URL Info" page (urls_show.ejs view)
app.get("/urls/:id", (req, res) => {
  // check if user already logged in, if not respond with appropriate error
  if (!req.session.user_id) {
    res.status(401).send("Please login or register to be able see shorten URL");
    return;
  }

  // check if shorten url exists in the DB, if not respond with appropriate error
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("The shorten URL you are trying to acces does not exist");
    return;
  }

  //get the urls data for given userId
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);

  // check if the the URL belongs to the user, if not respond with an error
  if (!userUrls[req.params.id]) {
    res.status(403).send("The shorten URL you are trying to access belongs to a different user");
    return;
  }

  //pass the relevant information by templateVars to the urls_show template view
  const userData = users[req.session.user_id];
  const templateVars = {
    id: req.params.id,
    longURL: userUrls[req.params.id],
    user: userData,
  };

  res.render("urls_show", templateVars);
});

// route to update a URL resource
app.post("/urls/:id", (req, res) => {
  // check if user already logged in, if not respond with appropriate error
  if (!req.session.user_id) {
    res.status(401).send("Please login or register to be able to update the URL");
    return;
  }

  // check if shorten url exists in the DB, if not respond with appropriate error
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("The shorten URL you are trying to update does not exist");
    return;
  }

  //get the urls data for given userId
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);

  // check if the the URL belongs to the user, if not respond with an error
  if (!userUrls[req.params.id]) {
    res.status(403).send("The shorten URL you are trying to update belongs to a different user");
    return;
  }

  //update the url in urlDatabase
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// route to remove a URL resource
app.post("/urls/:id/delete", (req, res) => {
  // check if user already logged in, if not respond with appropriate error
  if (!req.session.user_id) {
    res.status(401).send("Please login or register to be able to delete the URL");
    return;
  }

  // check if shorten url exists in the DB, if not respond with appropriate error
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("The shorten URL you are trying to delete does not exist");
    return;
  }

  //get the urls data for given userId
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);

  // check if the the URL belongs to the user, if not respond with an error
  if (!userUrls[req.params.id]) {
    res.status(403).send("The shorten URL you are trying to delete belongs to a different user");
    return;
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// route to redirect the user to the longURL per provided URL id
app.get("/u/:id", (req, res) => {
  // check if url provided exists in urlDatabase, if not respond with an error
  if (!urlDatabase[req.params.id]) {
    res.status(404).send(`${req.params.id} does not exist`);
    return;
  }

  // redirect the user to the requested URL
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
