import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// __dirname fix for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only PDF or image files are allowed'));
    }
    cb(null, true);
  }
});

const app = express();
app.use(cors());

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const ext = path.extname(req.file.filename).toLowerCase();

    // Handle PDF
    if (ext === '.pdf') {
      const data = await pdf(fs.readFileSync(filePath));
      res.json({
        type: 'pdf',
        name: req.file.originalname,
        size: req.file.size,
        text: data.text
      });
    }
    // Handle images
    else {
      const imgBuffer = fs.readFileSync(filePath);
      const base64 = imgBuffer.toString('base64');
      res.json({
        type: 'image',
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        base64: `data:${req.file.mimetype};base64,${base64}`
      });
    }

    fs.unlink(filePath, (err) => {
      if (err) console.error('unlink error', err);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

app.listen(8081, () => console.log('Upload server listening on http://localhost:8081'));
