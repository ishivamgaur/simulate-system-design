import express from "express";
import mongoose from "mongoose";

let app = express();

let activeRequests = 0;

app.use((req, res, next) => {
  activeRequests++;

  let counted = false;

  const done = () => {
    if (counted) return;

    counted = true;
    activeRequests--;
  };

  res.on("finish", done);
  res.on("close", done);

  next();
});

app.use(express.json());

const PORT = 5000;

// connect to mongodb
const connectDb = async () => {
  try {
    await mongoose.connect("mongodb://mongodb:27017/systemdesign");
    console.log("Mongodb Connected Successfully");
  } catch (error) {
    console.log(`Mongodb Error ${error}`);
    process.exit();
  }
};

// Product schema
const Product = mongoose.model(
  "Product",
  new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
  }),
);

app.get("/product", async (req, res) => {
  try {
    let products = await Product?.find();
    res.json({ count: products?.length, products });
  } catch (error) {
    res.status(500).json({ error: "Database Error" });
  }
});

app.post("/add-product", async (req, res) => {
  try {
    let { name, price, category } = req?.body;
    let product = await Product.create({ name, price, category });
    res.status(201).json({ created: "sucessfully", product });
  } catch (error) {
    console.error("erorr comming while adding product", error?.message);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// for metrics
app.get("/metrics", (req, res) => {
  res.json({
    activeRequests,
  });
});

app.get("/health", (req, res) => {
  res.json({ message: "Server status is healthy" });
});

connectDb().then(() => {
  app.listen(PORT, (req, res) => {
    console.log(`Server is running at port ${PORT}`);
  });
});
