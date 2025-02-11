const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const cors = require('cors');
const { initializeDatabase } = require("./init_database");


const PORT = String(process.env.PORT);
const HOST = String(process.env.HOST);

const SQL = "SELECT * FROM users;"

const PEPPER = "aae2";
const TOTP2SECRET = "hashpartfront";

const app = express();
app.use(cors());
app.use(express.json());


(async () => {
  connection = await initializeDatabase();
})();


app.use("/", express.static("frontend"));

app.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

app.get("/query", function (request, response) {
  if (!connection) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  connection.query(SQL, [true], (error, results, fields) => {
    if (error) {
      console.error(error.message);
      response.status(500).send("database error");
    } else {
      console.log(results);
      response.send(results);
    }
  });
})

app.post('/registration', async (req, res) => {
	const { username, email, password } = req.body;

	try {
		const [exisitingUser] = await connection.execute('SELECT * FROM users WHERE username=? OR email=?', [username, email]);
		const salt = 10;
		const passwordHash = await bcrypt.hash(password, salt);

		if (exisitingUser.length > 0) {
			return res.status(409).json({ success: false, message: "user already exists" });
		}

		const [result] = await connection.execute('INSERT INTO users (salt, username, email, password) VALUES (?,?,?)', ['0', username, email, passwordHash]);

		res.status(201).json({ success: true, message: 'User registered successfully' });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

app.post("/login", function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  if (!connection) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  const SQL = "SELECT * FROM users WHERE username=?";
  connection.query(SQL, [username], (error, results) => {
    if (error) {
      console.error(error.message);
      return res.status(500).send("Database error");
    }

    if (results.length === 0) {
      return res.status(404).send("User not found");
    }

    const user = results[0];
    const testPass = user.salt + password + PEPPER;
    const passMatched = bcrypt.compareSync(testPass, user.password);

    if (passMatched) {
      res.status(200).send("Success");
    } else {
      res.status(401).send("User not authorized");
    }
  });
})


app.post("/totp2", function (req, res) {
  const date = new Date();

  const inToken = req.body.tokenInput;
  const timestamp = Math.floor(date.getTime() / 30000); // Rounds to nearest 30 seconds

  // Generate the hashed TOTP token
  let hashedStr = TOTP2SECRET + timestamp.toString();
  hashedStr = crypto.createHash('sha256').update(hashedStr).digest('hex');
  const generatedToken = hashedStr.replace(/\D/g, "").slice(0, 6);

  // Validate the input token
  if (inToken === generatedToken) {
    res.status(200).send("Success");
  } else {
    res.status(401).send("Token is invalid.");
  }
})



app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
