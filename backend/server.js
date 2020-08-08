const { v4: uuid } = require('uuid');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const stripe = require("stripe")("sk_test_51HBVp6HERVJg4BokUytFKxcu5Df7mCM4gq8z9MlJ7NSbFLDhNKtIlZBzM4Zxss2pylrFNs0QcEH25XWYkb4gL8Aa00no4OIrsa")

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;


// middelware injection
app.use(cors());
app.use(express.json());

//routes
app.post("/payment", (req, res) => {
  const {product, token} = req.body; //token is the data supplied by FORM
  console.log("PRODUCT:", product);
  console.log("PRICE:", product.price)
  console.log("Token:", token)

  const idempotencyKey= uuid(); //to make sure user doesnt get charged the same item twice

  return stripe.customers.create({ //this creates a stripe instance to return to front end
    email:token.email,
    source: token.id 

  })
  .then(customer => {
    stripe.charges.create(
      { 
      amount: product.price * 100 ,// to get it in cents
      currency: "usd",
      customer: customer.id,
      receipt_email: token.email,
      description: product.name,
      shipping:{
        name: token.card.name,
        address:{
          country: token.card.address_country,
          line1: token.card.address_line1
        }
      }
    }, 
    {idempotencyKey}
    );
  })
  .then(result => res.status(200).json(result))
  .catch(err =>  console.log(err))
})

const productsRouter = require('./routes/product');
app.use('/product', productsRouter);


//listen/connect
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true , useUnifiedTopology: true}
);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});