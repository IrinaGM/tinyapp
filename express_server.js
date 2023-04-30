const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs"); // set ejs as the view engine
app.use(express.urlencoded({ extended: true }));

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

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// route to render the urls_index.ejs template
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// route to revieve the form subission as part of urls_new.ejs template
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console

  const newId = generateRandomString();

  urlDatabase[newId] = req.body.longURL;

  res.redirect(`/urls/${newId}`);
});

// route to render the urls_new.ejs template
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// route to render the urls_show.ejs template
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
