import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { spawn } from 'child_process';
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

let llamaProcess = null;
const modelsDir = "./models";

app.get("/api/models", (req, res) => {
  fs.readdir(modelsDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read models folder" });

    // Only include .gguf files
    const models = files.filter(f => f.toLowerCase().endsWith(".gguf"));
    res.json({ models });
  });
});

app.post('/api/start-model', (req, res) => {
  const { modelPath, mmprojPath, ctxSize } = req.body;

  if (llamaProcess) {
    return res.status(400).json({ error: 'A model is already running' });
  }

  const args = [
    '-m', modelPath,
    '--ctx-size', ctxSize || '1024',
    '--mmproj', mmprojPath
  ];

  llamaProcess = spawn('C:\\path\\to\\llama-server.exe', args, {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  llamaProcess.stdout.on('data', (data) => console.log(`[LLaMA] ${data}`));
  llamaProcess.stderr.on('data', (data) => console.error(`[LLaMA ERROR] ${data}`));
  llamaProcess.on('close', (code) => {
    console.log(`LLaMA exited with code ${code}`);
    llamaProcess = null;
  });

  res.json({ message: 'Model started' });
});

app.post('/api/stop-model', (req, res) => {
  if (!llamaProcess) return res.status(400).json({ error: 'No model running' });
  llamaProcess.kill();
  llamaProcess = null;
  res.json({ message: 'Model stopped' });
});

app.listen(8081, () => console.log('Upload server listening on http://localhost:8081'));
