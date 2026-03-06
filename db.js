const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync("./ca.pem")
  }
});

connection.connect((err) => {
  if (err) {
    console.error("Connection failed:", err);
  } else {
    console.log("Connected to Aiven MySQL");
  }
});

module.exports = connection;