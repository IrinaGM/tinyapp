/**
 * @function getUserByEmail finds if a user exists or not in the DB
 * @param {string} email
 * @returns {object} if user exists retuns the entire user object, if not returns null
 */
const getUserByEmail = (email, database) => {
  for (const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return null;
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
 * @function urlsForUser
 * @param {string} id
 * @returns {object} returns a map of short urls to long urls for given userId
 */
const urlsForUser = (id, database) => {
  const userUrls = {};
  for (const urlKey in database) {
    if (database[urlKey].userID === id) {
      userUrls[urlKey] = database[urlKey].longURL;
    }
  }
  return userUrls;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
};
