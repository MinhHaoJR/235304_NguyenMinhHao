const express = require("express");
const mongoose = require("mongoose");
const Device = require("../models/Device");

const router = express.Router();
const statuses = ["Đang sử dụng", "Hư hỏng", "Đang sửa chữa", "Ngừng sử dụng"];
const searchFields = ["deviceId", "name", "deviceType", "room"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateDevice(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Nội dung gửi lên phải là JSON object";
  }

  for (const field of ["deviceId", "name", "deviceType", "room"]) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      return "Thiếu hoặc sai trường " + field;
    }
  }

  if (!Number.isInteger(body.quantity) || body.quantity < 0) {
    return "quantity phải là số nguyên không âm";
  }

  if (!statuses.includes(body.status)) {
    return "status không hợp lệ";
  }

  if (body.purchaseDate && Number.isNaN(Date.parse(body.purchaseDate))) {
    return "purchaseDate không hợp lệ";
  }

  return null;
}

function sendError(res, error) {
  if (error.code === 11000) {
    return res.status(409).json({ message: "Mã thiết bị đã tồn tại" });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Lỗi máy chủ" });
}

router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = search
      ? {
          $or: searchFields.map((field) => ({
            [field]: {
              $regex: escapeRegex(search),
              $options: "i",
            },
          })),
        }
      : {};

    return res.json(await Device.find(filter).sort({ updatedAt: -1 }));
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    return res.json(device);
  } catch (error) {
    return sendError(res, error);
  }
});

router.post("/", async (req, res) => {
  const validationError = validateDevice(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const device = await Device.create(req.body);
    return res.status(201).json(device);
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  const validationError = validateDevice(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    return res.json(device);
  } catch (error) {
    return sendError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    return res.json({ message: "Đã xóa thiết bị", id: device._id });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;