const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = process.env.UPLOAD_PATH || "./uploads";

    if (file.fieldname === "images") {
      uploadPath = path.join(uploadPath, "properties/images");
    } else if (file.fieldname === "documents") {
      uploadPath = path.join(uploadPath, "properties/documents");
    } else if (file.fieldname === "kycDocuments") {
      uploadPath = path.join(uploadPath, "kyc");
    } else if (file.fieldname === "profileImage") {
      uploadPath = path.join(uploadPath, "profiles");
    }

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp/;
  const allowedDocTypes = /pdf|doc|docx|jpeg|jpg|png/;

  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");

  if (file.fieldname === "images" || file.fieldname === "profileImage") {
    if (allowedImageTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)"));
    }
  } else if (file.fieldname === "documents" || file.fieldname === "kycDocuments") {
    if (allowedDocTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed for documents"));
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
});

module.exports = upload;
