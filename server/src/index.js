const cors = require("cors");
const express = require("express");
require("dotenv").config({ path: "../.env" });

const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const carbonRoutes = require("./routes/carbon");
const myTreesRoutes = require("./routes/myTrees");
const orderRoutes = require("./routes/orders");
const trackingRoutes = require("./routes/tracking");
const treeRoutes = require("./routes/trees");

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", app: "TerraBioCol" });
});

app.use("/api/auth", authRoutes);
app.use("/api/trees", treeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/my-trees", myTreesRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/carbon", carbonRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.status || 500).json({
    message: error.message || "Error interno del servidor"
  });
});

app.listen(port, () => {
  console.log(`TerraBioCol API escuchando en http://localhost:${port}`);
});
