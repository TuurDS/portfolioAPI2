const express =  require("express");
const axios = require("axios");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

  
  async function wrapedSendMail(mailOptions) {
    return new Promise((resolve, reject) => {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_ADDRESS_FROM,
          pass: process.env.EMAIL_PASSWORD
        }
      })
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("error is " + error);
          resolve({ status: false, info: error });
        }
        else {
          console.log('Email sent: ' + info.response);
          resolve({ status: true, info: info.response });
        }
      });
    })
  };

const app = express();

const port = 9000;
app.listen(9000, () => {
    console.log(`Server is listening on port ${port}`);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



const allowedOrigins = ['http://127.0.0.1:5500', 'https://portfolio-api-2-rust.vercel.app'];

const corsOptions = {
  origin: (origin, callback) => {
    console.log(origin);
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Enable CORS with options
app.use(cors(corsOptions));
// app.use(cors());


app.post('/api/message', async (req, res) => {
    try {
      const response = await axios.post("https://www.google.com/recaptcha/api/siteverify", {}, {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: req.body.token
        }
      });
      console.log("reCAPTCHA score: " + response.data?.score);
      if (response.data === undefined || !response.data?.success || response.data?.score < 0.5 ) {
        res.status(403).send("FAIL");
        return;
      }
  
      var mailOptions = {
        from: process.env.EMAIL_ADDRESS_FROM,
        to: process.env.EMAIL_ADDRESS_TO,
        subject: req.body.subject,
        text: `name: ${req.body.name}\nemail: ${req.body.email}\nmessage: ${req.body.message}`
      };
  
      const { status, info } = await wrapedSendMail(mailOptions);
      if (!status) {
        res.status(404).send("FAIL");
        return;
      } else {
        res.send("OK");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });
  