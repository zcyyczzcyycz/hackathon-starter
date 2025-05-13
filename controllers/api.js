const path = require('path');
const multer = require('multer');


/**
 * GET /api/upload
 * File Upload API example.
 */

exports.getFileUpload = (req, res) => {
  res.render('api/upload', {
    title: 'File Upload',
  });
};

exports.postFileUpload = (req, res) => {
  if (!req.file && req.multerError) {
    if (req.multerError.code === 'LIMIT_FILE_SIZE') {
      req.flash('errors', {
        msg: 'File size is too large. Maximum file size allowed is 1MB',
      });
      return res.redirect('/api/upload');
    }
    req.flash('errors', { msg: req.multerError.message });
    return res.redirect('/api/upload');
  }

  req.flash('success', { msg: 'File was uploaded successfully.' });
  res.redirect('/api/upload');
};

exports.uploadMiddleware = (req, res, next) => {
  // configure Multer with a 1 MB limit
  const upload = multer({
    dest: path.join(__dirname, '../uploads'),
    limits: { fileSize: 1024 * 1024 * 1 },
  });
  upload.single('myFile')(req, res, (err) => {
    if (err) {
      req.multerError = err; // Now we're explicitly attaching the error
    }
    next();
  });
};

