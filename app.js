const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`error message:${e.message}`);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, gender, password, location } = request.body;
  const userExists = `
    SELECT
        *
    FROM
        user
    WHERE
        username='${username}';`;
  const dbUser = await db.get(userExists);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(request.body.password, 13);
      const newUser = `
                INSERT INTO 
                    user(username,name,gender,password,location)
                VALUES
                    (
                        '${username}',
                        '${name}',
                        '${gender}',
                        '${hashedPassword}',
                        '${location}'
                    );`;
      await db.run(newUser);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userExists = `
    SELECT
        *
    FROM
        user
    WHERE
        username='${username}';`;
  const dbUser = await db.get(userExists);
  if (dbUser !== undefined) {
    const passwordMatch = await bcrypt.compare(
      request.body.password,
      dbUser.password
    );
    if (passwordMatch === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userExists = `
    SELECT
        *
    FROM
        user
    WHERE
        username='${username}';`;
  const dbUser = await db.get(userExists);

  if (dbUser !== undefined) {
    const passwordMatch = await bcrypt.compare(
      request.body.oldPassword,
      dbUser.password
    );

    if (passwordMatch === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newHashedPassword = await bcrypt.hash(newPassword, 13);
        const updatePassword = `
            UPDATE 
                user 
            SET
                password='${newHashedPassword}'
            WHERE 
                username='${username}';`;
        const newDetails = await db.run(updatePassword);
        response.status(200);
        response.send("Password updated");
      }
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

module.exports = app;
