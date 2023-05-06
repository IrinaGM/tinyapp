const express = require("express");
const morgan = require("morgan");
//const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs"); // set ejs as the view engine
app.use(express.urlencoded({ extended: true })); // middleware that parses incoming requests with URL-encoded payloads and is based on a body parser
app.use(morgan("dev")); // middleware to log HTTP requests for my app
//app.use(cookieParser()); // middleware to parse cookies
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

/**
 * @function generateRandomString returns string of 6 random alphanumeric characters
 * @return {string} 6 random alphanumeric characters
 */
const generateRandomString = () => {
  let string = "";
  const length = 6;
  Array.from({ length }).some(() => {
    string += Math.random().toString(36).slice(2);
    return string.length >= length;
  });
  return string.slice(0, length);
};

/**
 * @function getUserByEmail finds if a user exists or not in the DB
 * @param {string} email
 * @returns {object} if user exists retuns the entire user object, if not returns null
 */
const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

/**
 * @function urlsForUser
 * @param {string} id
 * @returns {object} returns a map of short urls to long urls for given userId
 */
const urlsForUser = (id) => {
  const userUrls = {};
  for (const urlKey in urlDatabase) {
    if (urlDatabase[urlKey].userID === id) {
      userUrls[urlKey] = urlDatabase[urlKey].longURL;
    }
  }
  return userUrls;
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
  if (getUserByEmail(req.body.email)) {
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

  console.log("user[newId]", users[newId]);
  //res.cookie("user_id", newId);
  req.session.user_id = newId;
  console.log("req.session.user_id", req.session.user_id);
  res.redirect("/urls");
});

// route to render the login page
app.get("/login", (req, res) => {
  //check if user already logged in by checing if cookie user_id already exists
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  // find user's data based on the cookie info (users id)
  const userData = users[req.session.user_id];
  const templateVars = { user: userData };
  res.render("login", templateVars);
});

// route to validate the email and password provided in login page
app.post("/login", (req, res) => {
  // set user email and password if they exist, if not set them to null
  const email = req.body.email ? req.body.email : null;
  const password = req.body.password ? req.body.password : null;

  // show error if email and/or passord was not provided
  if (email === null || password === null) {
    res.status(400).send("Please provide email and password");
    return;
  }

  // check if user exists in users DB, if not userData will be false
  const userData = getUserByEmail(email);

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

  // set up cookie with the user id as written in users DB
  //res.cookie("user_id", userData.id);
  req.session.user_id = userData.id;
  res.redirect("/urls");
});

// route for logout functionality, clears the user name cookie and redirects the user back to the /login page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// route to render the all existing URLs on "My URLs" page (urls_index.ejs view)
app.get("/urls", (req, res) => {
  // check if user already logged in, if not respond with error
  if (!req.session.user_id) {
    res.status(401).send("Please login or register to be able to see your shorten URLs");
    return;
  }

  //populate templateVars based on user id
  const userData = users[req.session.user_id];
  const userUrls = urlsForUser(req.session.user_id);
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
  // add the new url to DB.
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
  const userUrls = urlsForUser(req.session.user_id);

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
  const userUrls = urlsForUser(req.session.user_id);

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
  const userUrls = urlsForUser(req.session.user_id);

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
