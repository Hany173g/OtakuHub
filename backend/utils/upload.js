const multer =  require('multer');











const storage = multer.diskStorage({
    destination:'./uploads/',
    filename: (req,file,cb) => {
        cb(null,   Date.now() + '-'+ file.originalname)
    }
})

// Initialize upload middleware and add file size limit
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB فقط
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("يجب أن تكون الصورة بصيغة JPEG أو PNG"), false);
    }
    cb(null, true);
  }
});


const checkSizePhoto =  (req, res, next) => {
    upload.single('photo')(req, res, function (err) {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "الحجم الأقصى للملف 3 ميجا" });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }






module.exports = {checkSizePhoto};