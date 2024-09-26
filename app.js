const express = require('express');
const mysql = require('mysql');
const app = express();

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Set up the MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'website'
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL Database!');
});

// Route to fetch and display student data
app.get('/customers', (req, res) => {
  let sql = 'SELECT * FROM customers';
  
  db.query(sql, (err, result) => {
    if (err) throw err;

    // Render the 'students.ejs' view and pass the results
    res.render('customers', { customers: result });
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
