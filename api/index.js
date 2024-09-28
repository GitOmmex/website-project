const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs"); // Use bcrypt for hashing passwords
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../public"))); // Adjusted path

// Serve index.html for the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html")); // Adjusted path
});

const pool = mysql.createPool({
  host: "sql12.freesqldatabase.com",
  user: process.env.SQL_USER,
  password: process.env.SQL_PASS,
  database: process.env.SQL_USER, // Make sure this is your actual database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// API to Add Item to Cart
app.post("/api/cart", async (req, res) => {
  const { product_id, quantity } = req.body;

  try {
    const connection = await pool.getConnection(); // Get a connection from the pool
    console.log("Connected to MySQL database");

    // Check if the product is already in the cart
    const query = "SELECT * FROM cart WHERE product_id = ?";
    const [result] = await connection.query(query, [product_id]); // Use async/await

    if (result.length > 0) {
      // If the product exists, update the quantity
      const updateQuery =
        "UPDATE cart SET quantity = quantity + ? WHERE product_id = ?";
      await connection.query(updateQuery, [quantity, product_id]); // Use async/await
      res.json({ message: "Cart updated successfully" });
    } else {
      // If the product does not exist, insert it
      const insertQuery =
        "INSERT INTO cart (product_id, quantity) VALUES (?, ?)";
      await connection.query(insertQuery, [product_id, quantity]); // Use async/await
      res.json({ message: "Item added to cart" });
    }

    connection.release(); // Release the connection back to the pool
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
});

// API to Get Cart Items
app.get("/api/cart", async (req, res) => {
  const query = `
    SELECT cart.id, products.name, products.price, cart.quantity 
    FROM cart 
    JOIN products ON cart.product_id = products.id
  `;

  try {
    const connection = await pool.getConnection(); // Get a connection from the pool
    console.log("Connected to MySQL database");

    const [results] = await connection.query(query); // Use async/await for the query
    res.json(results); // Send the results as JSON

    connection.release(); // Release the connection back to the pool
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
});

// API to Remove Item from Cart
app.delete("/cart/:id", (req, res) => {
  const cartId = req.params.id;
  const deleteQuery = "DELETE FROM cart WHERE id = ?";
  db.query(deleteQuery, [cartId], (err, result) => {
    if (err) throw err;
    res.json({ message: "Item removed from cart" });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];

      // Check if the password is correct
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          res.json({ success: true });
        } else {
          res.json({ success: false, message: "Incorrect password" });
        }
      });
    } else {
      res.json({ success: false, message: "Email not found" });
    }
  });
});

const saltRounds = 10; // Defines the strength of the hash

// Function to generate a 6-digit OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

let otpStore = {};

//Initiate sign-up by sending OTP
app.post("/signup-initiate", (req, res) => {
  const { email, password } = req.body;

  // Check if the email is already registered
  const checkEmailQuery = "SELECT * FROM users WHERE email = ?";

  db.query(checkEmailQuery, [email], async (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      return res.json({ success: false, message: "Email already registered" });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate OTP and store it along with hashed password
    const otp = generateOtp();
    otpStore[email] = { otp, hashedPassword }; // Store OTP and hashed password temporarily

    const mailOptions = {
      from: "marpc.main@gmail.com",
      to: email,
      subject: "Your OTP for Marc's PCs Signup",
      text: `Your OTP is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ success: false, message: "Error sending OTP" });
      }

      res.json({ success: true, message: "OTP sent to your email" });
    });
  });
});

//Verify OTP and complete sign-up
app.post("/signup-verify", async (req, res) => {
  const { email, otp } = req.body;

  // Check if OTP exists for the given email in our store
  const storedData = otpStore[email];

  if (storedData && storedData.otp === otp) {
    // OTP is valid, proceed with user registration
    const hashedPassword = storedData.hashedPassword; // Get the hashed password

    // Insert the new user into the database
    const query = "INSERT INTO users (email, password) VALUES (?, ?)";
    const values = [email, hashedPassword];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({
          success: false,
          message: "Database error. Please try again.",
        });
      }

      // Remove OTP from store after successful registration
      delete otpStore[email];

      // Send success response
      res.json({ success: true });
    });
  } else {
    // OTP is invalid
    res.json({ success: false, message: "Invalid OTP." });
  }
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log("Server running on port ", process.env.PORT);
});

module.exports = app;
