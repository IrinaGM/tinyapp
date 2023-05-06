const { assert } = require("chai");

const { getUserByEmail, urlsForUser } = require("../helpers.js");

const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const testUrlDatabase = {
  abcdef: { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  ghij68: { longURL: "http://www.google.com", userID: "userRandomID" },
  "8nhd80": { longURL: "http://www.youtube.com", userID: "user2RandomID" },
  "0jf8hk": { longURL: "http://www.netflix.ca", userID: "user2RandomID" },
};

describe("@function getUserByEmail", () => {
  it("should return a user with valid email", () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    const expectedEmail = "user@example.com";
    assert.strictEqual(user.id, expectedUserID);
    assert.strictEqual(user.email, expectedEmail);
  });

  it("should return NULL when user email does not exist in the users DB", () => {
    const user = getUserByEmail("user5@example.com", testUsers);
    const expectedResult = null;
    assert.strictEqual(user, expectedResult);
  });
});

describe("@function urlsForUser", () => {
  it("should return an object of URLs beloning to specific user", () => {
    const userUrls = urlsForUser("userRandomID", testUrlDatabase);
    const expectedResult = {
      abcdef: "http://www.lighthouselabs.ca",
      ghij68: "http://www.google.com",
    };
    assert.deepEqual(userUrls, expectedResult);
  });

  it("should return an empty object if there are no URLs beloning to that user", () => {
    const userUrls = urlsForUser("userIdRandom5", testUrlDatabase);
    const expectedResult = {};
    assert.deepEqual(userUrls, expectedResult);
  });
});
