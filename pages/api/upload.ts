// pages/api/upload.js

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  const { filename, userId, fileHash, contentType } = JSON.parse(req.body);

  const signedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `${userId}/${fileHash}/${filename}`,  // Use the userId as a prefix in the Key
      ContentType: contentType,
    }),
    { expiresIn: 3600 }
  );

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    url: signedUrl,
    method: "PUT",
  });
  res.end();
}






