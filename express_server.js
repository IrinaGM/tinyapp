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
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

/**
 * @function generateRandomString
 * @return {string} - 6 random alphanumeric characters
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

// route to recive the username for user login
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

//TODO: clean up unused route:
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// route to render the urls_index.ejs template
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// route to receive the form subission as part of urls_new.ejs template
app.post("/urls", (req, res) => {
  console.log(req.body);

  const newId = generateRandomString();

  urlDatabase[newId] = req.body.longURL; // add the new url to DB.

  res.redirect(`/urls/${newId}`);
});

// route to render the urls_new.ejs template
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

// route to render the urls_show.ejs template
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});

// route to update a URL resource
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// route to remove a URL resource
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// route to redirect the user to the longURL per provided URL id
app.get("/u/:id", (req, res) => {
  // TODO: handle short URL with non-existing id
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

//TODO: clean up unused route:
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
