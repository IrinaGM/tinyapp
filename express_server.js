const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs"); // set ejs as the view engine
app.use(express.urlencoded({ extended: true })); // middleware that parses incoming requests with URL-encoded payloads and is based on a body parser
app.use(morgan("dev")); // middleware to log HTTP requests for my app
app.use(cookieParser()); // middleware to parse cookies

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "5d63jf" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "5d63jf" },
};

const users = {
  "5d63jf": {
    id: "5d63jf",
    email: "test@example.com",
    password: "testpass",
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

// route for user registration form rendering
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
    return;
  }
  const userData = users[req.cookies["user_id"]];
  const templateVars = { user: userData };
  res.render("register", templateVars);
});

// rout for user registration form that saves the user data in local db and creates a cookie
app.post("/register", (req, res) => {
  const newId = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Email and password cannot be blank");
  }

  if (getUserByEmail(req.body.email)) {
    console.log("users", users);
    res.status(400).send("User already exists");
  }

  users[newId] = {
    id: newId,
    email: req.body.email,
    password: req.body.password,
  };
  res.cookie("user_id", newId);
  res.redirect("/urls");
});

// route to render the login page
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const userData = users[req.cookies["user_id"]];
  const templateVars = { user: userData };
  res.render("login", templateVars);
});

// route to validate the email and password provided in login page
app.post("/login", (req, res) => {
  const email = req.body.email ? req.body.email : null;
  const password = req.body.password ? req.body.password : null;

  // show error if email and/or passord was not provided
  if (email === null || password === null) {
    res.status(400).send("Please provide email and password");
  }

  const userData = getUserByEmail(email);
  if (!userData) {
    res.status(403).send("Email cannot be found");
  }

  if (userData.password !== password) {
    res.status(403).send("Password does not match for that email account");
  }
  res.cookie("user_id", userData.id);
  res.redirect("/urls");
});

// route for logout functionality, clears the user name cookie and redirects the user back to the /login page
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// route to render the all existing URLs on "My URLs" page (urls_index.ejs view)
app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }

  const userData = users[req.cookies["user_id"]];
  const templateVars = { urls: urlDatabase, user: userData };
  console.log("urlDatabase", urlDatabase);
  res.render("urls_index", templateVars);
});

// route to save the new URL provided in a form on "New URL" page (urls_new.ejs view)
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(401).send("Please login or register to be able to shorten URL");
    return;
  }

  const newId = generateRandomString();
  // add the new url to DB.
  urlDatabase[newId] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  res.redirect(`/urls/${newId}`);
});

// route to render the "Create TinyURL" page (urls_new.ejs view)
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }

  const userData = users[req.cookies["user_id"]];
  const templateVars = { user: userData };
  res.render("urls_new", templateVars);
});

// route to render the "URL Info" page (urls_show.ejs view)
app.get("/urls/:id", (req, res) => {
  const userData = users[req.cookies["user_id"]];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: userData,
  };

  res.render("urls_show", templateVars);
});

// route to update a URL resource
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// route to remove a URL resource
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// route to redirect the user to the longURL per provided URL id
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send(`${req.params.id} does not exist`);
    return;
  }

  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
