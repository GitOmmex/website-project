const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt"); // Use bcrypt for hashing passwords
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Parse JSON request bodies

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Your MySQL username
  password: "", // Your MySQL password
  database: "marc_pcs", // Your database name
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

// API to Add Item to Cart
app.post("/cart", (req, res) => {
  const { product_id, quantity } = req.body;

  // Check if the product is already in the cart
  const query = "SELECT * FROM cart WHERE product_id = ?";
  db.query(query, [product_id], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      // If the product exists, update the quantity
      const updateQuery =
        "UPDATE cart SET quantity = quantity + ? WHERE product_id = ?";
      db.query(updateQuery, [quantity, product_id], (err, updateResult) => {
        if (err) throw err;
        res.json({ message: "Cart updated successfully" });
      });
    } else {
      // If the product does not exist, insert it
      const insertQuery =
        "INSERT INTO cart (product_id, quantity) VALUES (?, ?)";
      db.query(insertQuery, [product_id, quantity], (err, insertResult) => {
        if (err) throw err;
        res.json({ message: "Item added to cart" });
      });
    }
  });
});

// API to Get Cart Items
app.get("/cart", (req, res) => {
  const query = `SELECT cart.id, products.name, products.price, cart.quantity 
                   FROM cart 
                   JOIN products ON cart.product_id = products.id`;
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
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
          // Save user in session
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

app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  // Check if the email is already registered
  const checkEmailQuery = "SELECT * FROM users WHERE email = ?";

  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      return res.json({ success: false, message: "Email already registered" });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Hashing error" });
      }

      // Insert new user into the database
      const insertUserQuery =
        "INSERT INTO users (email, password) VALUES (?, ?)";

      db.query(insertUserQuery, [email, hash], (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Database insertion error" });
        }

        res.json({ success: true, message: "User registered successfully" });
      });
    });
  });
});

// Generate OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

let otpStore = {}; // Temporary store for OTPs (use a better store in production)

// Step 1: Initiate sign-up by sending OTP
app.post("/signup-initiate", (req, res) => {
  const { email, password } = req.body;

  // Check if the email is already registered
  const checkEmailQuery = "SELECT * FROM users WHERE email = ?";

  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      return res.json({ success: false, message: "Email already registered" });
    }

    // Generate OTP and send it via email
    const otp = generateOtp();
    otpStore[email] = otp; // Store OTP temporarily

    const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: "Your OTP for Marc's PCs Signup",
      text: `Your OTP is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res
          .status(500)
          .json({ success: false, message: "Error sending OTP" });
      }

      res.json({ success: true, message: "OTP sent to your email" });
    });
  });
});

// Step 2: Verify OTP and complete sign-up
app.post("/signup-verify", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    // OTP verified, now hash password and save user to database
    const password = req.body.password;

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Hashing error" });
      }

      const insertUserQuery =
        "INSERT INTO users (email, password) VALUES (?, ?)";

      db.query(insertUserQuery, [email, hash], (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Database insertion error" });
        }

        // Remove OTP from store after successful sign-up
        delete otpStore[email];

        res.json({ success: true, message: "User registered successfully" });
      });
    });
  } else {
    res.json({ success: false, message: "Invalid OTP" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
