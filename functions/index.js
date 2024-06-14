const express = require("express");
const serverless = require("serverless-http");
const path = require("path");
const mongoose = require("mongoose");
const Student = require("./student");
const app = express();

// Load environment variables from .env file
require('dotenv').config();

// Connect to MongoDB
mongoose.set("strictQuery", false);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MongoDB URI is not defined in the environment variables');
  process.exit(1); // Exit the process if MongoDB URI is not defined
}

mongoose.connect(
  MONGODB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit the process if MongoDB connection fails
});

// Define your routes and other application logic below

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

app.use(express.json()); // Middleware to parse JSON requests

// Route to insert a student
app.post("/insertStudent", async (req, res) => {
  const { studentId, name, password, payment } = req.body;

  // Log the incoming request body
  console.log("Request Body:", req.body);

  try {
    // Check if required fields are provided
    if (
      !studentId ||
      !name ||
      !password ||
      !payment ||
      !payment.amountToBePaid ||
      !payment.paidAmount
    ) {
      return res.status(400).json({
        error: "Please provide all required fields: studentId, name, password, payment.amountToBePaid, payment.paidAmount.",
      });
    }

    // Create a new student
    const student = new Student({
      studentId,
      name,
      password,
      payment: {
        amountToBePaid: payment.amountToBePaid,
        paidAmount: payment.paidAmount,
      },
    });

    // Save the student to the database
    await student.save();
    console.log("Student inserted successfully:", student);
    res.status(201).json({ message: "Student inserted successfully", student });
  } catch (error) {
    console.error("Error inserting student:", error);
    res.status(500).json({ error: "Error inserting student", message: error.message });
  }
});

// Serve static files from the same directory (functions) if any
app.use(express.static(__dirname));

// Serve static files from the statics directory
app.use(express.static(path.join(__dirname, "../statics")));

// Serve the main page with a button
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Main Page</title>
        <link rel="stylesheet" type="text/css" href="/app.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class='background'>
          <h1 class="heading"><span>ACADEMIC DIVISION</span></h1>
          <h1 class="learning">LEARNING MANAGEMENT SYSTEM</h1>
          <form action="/home" method="get">
            <button class="button" type="submit">L O G I N</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// Route to render dynamic HTML content for login
app.get("/home", (req, res) => {
  const dynamicHtml = `
    <html>
      <head>
        <title>Login</title>
        <link rel="stylesheet" type="text/css" href="/app.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class='background'>
          <h1 class="heading home-heading"><span>ACADEMIC DIVISION</span></h1>
          <h1 class="home-learning">LEARNING MANAGEMENT SYSTEM</h1>
          <div class='form-div'>
            <form action="/info" method="get">
              <h1 class='credentials'>CREDENTIALS</h1>
              <div class="input-div">
                <input class='login-input' type="text" name="stnumber" id="stnumber" placeholder="STUDENT NUMBER" required>
                <input class='login-input' type="password" name="password" id="password" placeholder="PASSWORD" required>
              </div>
              <button type="submit" class="button home-btn">LOGIN</button>
            </form>
          </div>
        </div>
      </body>
    </html>
  `;
  res.send(dynamicHtml);
});

const insertStudents = async () => {
  const studentsToAdd = [
    {
      studentId: "20000",
      name: "Kate",
      password: "KT123",
      payment: {
        amountToBePaid: 5000,
        paidAmount: 5000,
      },
    },
    {
      studentId: "20001",
      name: "John",
      password: "password123",
      payment: {
        amountToBePaid: 6000,
        paidAmount: 5500,
      },
    },
    {
      studentId: "20002",
      name: "Emily",
      password: "emily123",
      payment: {
        amountToBePaid: 7000,
        paidAmount: 6000,
      },
    },
    // Add more student objects as needed
  ];

  try {
    await Student.insertMany(studentsToAdd);
    console.log("Multiple students inserted successfully");
  } catch (error) {
    console.error("Error inserting students:", error);
  }
};

insertStudents();

// INFO ROUTE
app.get("/info", async (req, res) => {
  const stnumber = req.query.stnumber;
  const password = req.query.password;

  try {
    const student = await Student.findOne({ studentId: stnumber });

    // Check if student is found and password matches
    if (!student || student.password !== password) {
      // Redirect to home page with an alert if credentials are incorrect
      return res.send(`
        <script>
          alert('Wrong student number or password. Please try again.');
          window.location.href = '/home';
        </script>
      `);
    }

    // Render student info if credentials are correct
    const studentInfoHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Info</title>
          <link rel="stylesheet" type="text/css" href="/app.css">
        </head>
        <body>
          <div class='info'>
            <div class="student">
              <h1 class="welcome">Welcome ${student.name}!</h1>
              <div class="box">
                <ul>
                  <li>STUDENT ID: ${student.studentId}</li>
                </ul>
                <form class="info-form" action="/payment" method="get">
                  <input type="hidden" name="stnumber" value="${student.studentId}">
                  <button type="submit" class="info-btn">Check Payment</button>
                </form>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    res.send(studentInfoHtml);
  } catch (err) {
    console.error("Error retrieving student information:", err);
    res.status(500).send("Server error");
  }
});

// Route to render payment details
app.get("/payment", async (req, res) => {
  const stnumber = req.query.stnumber;
  try {
    const student = await Student.findOne({ studentId: stnumber });

    if (!student || !student.payment) {
      return res.status(400).send('Student or payment information not found.');
    }

    const isButtonDisabled = student.payment.paidAmount < student.payment.amountToBePaid;

    const paymentDetailsHtml = `
      <html>
        <head>
          <title>Payment Details</title>
        </head>
        <body>
          <h1>Payment Details</h1>
          <ul>
            <li>Amount to be Paid: Rs. ${student.payment.amountToBePaid}</li>
            <li>Paid Amount: Rs. ${student.payment.paidAmount}</li>
          </ul>
          <form action="/classroom" method="get">
            <button ${isButtonDisabled ? "disabled" : ""} type="submit">Link to Class</button>
          </form>
        </body>
      </html>
    `;
    res.send(paymentDetailsHtml);
  } catch (err) {
    console.error("Error retrieving payment information:", err);
    res.status(500).send('Server error');
  }
});

// Route to the classroom
app.get("/classroom", (req, res) => {
  const classroomContent = `
    <html>
      <head>
        <title>Classroom</title>
      </head>
      <body>
        <h1>Welcome to the Classroom!</h1>
        <p>The zoom content appears here.</p>
      </body>
    </html>
  `;
  res.send(classroomContent);
});

// Start the server locally if not running in a serverless environment
if (process.env.NODE_ENV !== "production") {
  const port = 3000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

// Export the Express app wrapped with serverless-http
module.exports.handler = serverless(app);
