require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Device = require("./models/Device");
const deviceRoutes = require("./routes/deviceRoutes");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/", async (req, res) => {
  const devices = await Device.find().sort({ createdAt: -1 });
  return res.json(devices);
});

app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "database_disconnected",
  });
});

app.use("/api/devices", deviceRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: "Không tìm thấy endpoint" });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  return res.status(status).json({
    message: status === 400 ? "JSON gửi lên không hợp lệ" : "Lỗi máy chủ",
  });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Thiếu biến môi trường MONGODB_URI");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || "235304_NguyenMinhHao",
    serverSelectionTimeoutMS: 10000,
  });

  await Device.init();

  const port = Number(process.env.PORT || 3000);
  app.listen(port, "0.0.0.0", () => {
    console.log("Backend đang chạy tại port " + port);
  });
}

start().catch((error) => {
  console.error("Không khởi động được backend:", error.message);
  process.exit(1);
});
