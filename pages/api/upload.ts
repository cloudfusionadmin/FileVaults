import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../../models/User';

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, JWT_SECRET_KEY } = process.env;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Token missing.' });
  }

  let decoded;
  try {
    // Verify JWT token
    decoded = jwt.verify(token, JWT_SECRET_KEY as string);
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token.' });
  }

  const { filename, userId, fileHash, contentType } = JSON.parse(req.body);
  const fileSize = parseInt(req.headers['content-length'] || '0', 10); // Safely parse file size

  if (isNaN(fileSize) || fileSize <= 0) {
    return res.status(400).json({ error: 'Invalid file size.' });
  }

  try {
    // Fetch the user from the database
    const user = await User.findOne({ where: { id: decoded.user.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure the userId passed matches the user's id
    if (user.id !== parseInt(userId, 10)) {
      return res.status(403).json({ error: 'Unauthorized action for this user.' });
    }

    // Check if the user has enough storage
    if (user.currentStorage + fileSize > user.maxStorage) {
      const remainingStorage = user.maxStorage - user.currentStorage;
      return res.status(400).json({ error: `Insufficient storage. You have ${remainingStorage} bytes remaining.` });
    }

    // Proceed with file upload if storage is available
    const signedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: `${userId}/${fileHash}/${filename}`,  // Use the userId as a prefix in the Key
        ContentType: contentType || 'application/octet-stream', // Default content type if not provided
      }),
      { expiresIn: 3600 }
    );

    // Update user's current storage after successful upload
    user.currentStorage += fileSize;
    await user.save();

    // Return the signed URL for the client to upload the file
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
      url: signedUrl,
      method: "PUT",
    });
  } catch (err) {
    console.error('Error handling upload:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
