const Minio = require('minio');

const client = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'mi_clase',
  secretKey: process.env.MINIO_SECRET_KEY || 'mi_clase_secret',
});

const BUCKET = process.env.MINIO_BUCKET || 'mi-clase';

async function initStorage() {
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    await client.makeBucket(BUCKET);
    console.log(`[minio] created bucket: ${BUCKET}`);
  }
}

async function uploadFile(objectKey, buffer, mimetype) {
  await client.putObject(BUCKET, objectKey, buffer, buffer.length, {
    'Content-Type': mimetype,
  });
}

async function getFileStream(objectKey) {
  return client.getObject(BUCKET, objectKey);
}

async function deleteFile(objectKey) {
  await client.removeObject(BUCKET, objectKey);
}

module.exports = { initStorage, uploadFile, getFileStream, deleteFile, BUCKET };
