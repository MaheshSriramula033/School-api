require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- DATABASE CONNECTION ---------------- */

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync("./ca.pem")
  }
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to Aiven MySQL");
  }
});

/* ---------------- HOME ROUTE ---------------- */

app.get("/", (req, res) => {
  res.send("School Management API Running");
});

/* ---------------- ADD SCHOOL API ---------------- */

app.post("/addSchool", (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validation
  if (!name || !address || latitude == null || longitude == null) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({
      message: "Latitude and Longitude must be numbers"
    });
  }

  const sql =
    "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Database error"
      });
    }

    res.status(201).json({
      message: "School added successfully",
      schoolId: result.insertId
    });
  });
});

/* ---------------- LIST SCHOOLS API ---------------- */

app.get("/listSchools", (req, res) => {

  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({
      message: "Latitude and Longitude query parameters are required"
    });
  }

  const sql = "SELECT * FROM schools";

  db.query(sql, (err, schools) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Database error"
      });
    }

    // Haversine Distance Formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    };

    const schoolsWithDistance = schools.map((school) => {
      const distance = calculateDistance(
        userLat,
        userLon,
        school.latitude,
        school.longitude
      );

      return {
        ...school,
        distance: distance.toFixed(2)
      };
    });

    // Sort by distance
    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  });
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});