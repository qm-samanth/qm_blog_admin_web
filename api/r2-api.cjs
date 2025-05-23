// api/r2-api.cjs
// Backend API for Cloudflare R2 integration (CommonJS)

const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const cors = require('cors');
const app = express();
const upload = multer();

// TODO: Fill in your Cloudflare R2 credentials and bucket info
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '60eb2b8672eabb365d8b100508996be8';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'c32b8ebca617c04bfb8a050021cf663e197a767796fbc9cb5dd0dfbbe70d492a';
const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://65b7d9d20ff7aaa229750974bf30539d.r2.cloudflarestorage.com';
const R2_BUCKET = process.env.R2_BUCKET || 'qualminds';


const s3 = new AWS.S3({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  endpoint: R2_ENDPOINT,
  signatureVersion: 'v4',
  region: 'auto',
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/r2/health', (req, res) => {
  res.json({ status: 'ok' });
});

// List folders/files under a prefix
app.get('/api/r2/list', async (req, res) => {
  const prefix = req.query.prefix || '';
  try {
    const data = await s3.listObjectsV2({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    }).promise();
    res.json({
      folders: data.CommonPrefixes ? data.CommonPrefixes.map(cp => cp.Prefix) : [],
      files: data.Contents ? data.Contents.filter(obj => obj.Key !== prefix).map(obj => obj.Key) : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a folder (by uploading a zero-byte object with trailing slash)
app.post('/api/r2/folder', async (req, res) => {
  const { folder } = req.body;
  if (!folder) return res.status(400).json({ error: 'Missing folder name' });
  try {
    await s3.putObject({
      Bucket: R2_BUCKET,
      Key: folder.endsWith('/') ? folder : folder + '/',
      Body: '',
    }).promise();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a file or folder (recursively for folders)
app.delete('/api/r2/object', async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing key' });
  try {
    // If key ends with '/', delete all objects with that prefix (folder)
    if (key.endsWith('/')) {
      const listed = await s3.listObjectsV2({ Bucket: R2_BUCKET, Prefix: key }).promise();
      if (listed.Contents.length === 0) return res.json({ success: true });
      const deleteParams = {
        Bucket: R2_BUCKET,
        Delete: { Objects: listed.Contents.map(obj => ({ Key: obj.Key })) },
      };
      await s3.deleteObjects(deleteParams).promise();
      res.json({ success: true });
    } else {
      // Delete single file
      await s3.deleteObject({ Bucket: R2_BUCKET, Key: key }).promise();
      res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename a file or folder (copy then delete)
app.post('/api/r2/rename', async (req, res) => {
  const { oldKey, newKey } = req.body;
  if (!oldKey || !newKey) return res.status(400).json({ error: 'Missing oldKey or newKey' });
  try {
    // If folder, copy all objects with prefix
    if (oldKey.endsWith('/')) {
      const listed = await s3.listObjectsV2({ Bucket: R2_BUCKET, Prefix: oldKey }).promise();
      for (const obj of listed.Contents) {
        const newObjKey = obj.Key.replace(oldKey, newKey);
        await s3.copyObject({
          Bucket: R2_BUCKET,
          CopySource: `/${R2_BUCKET}/${obj.Key}`,
          Key: newObjKey,
        }).promise();
      }
      // Delete old objects
      const deleteParams = {
        Bucket: R2_BUCKET,
        Delete: { Objects: listed.Contents.map(obj => ({ Key: obj.Key })) },
      };
      await s3.deleteObjects(deleteParams).promise();
      res.json({ success: true });
    } else {
      // Single file
      await s3.copyObject({
        Bucket: R2_BUCKET,
        CopySource: `/${R2_BUCKET}/${oldKey}`,
        Key: newKey,
      }).promise();
      await s3.deleteObject({ Bucket: R2_BUCKET, Key: oldKey }).promise();
      res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a file
app.post('/api/r2/upload', upload.single('file'), async (req, res) => {
  const folder = req.body.folder || '';
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const key = folder ? `${folder.replace(/\/+$/, '')}/${file.originalname}` : file.originalname;
  try {
    await s3.putObject({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }).promise();
    res.json({ success: true, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Cloudflare R2 API server running on port ${PORT}`);
});
