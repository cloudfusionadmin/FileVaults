import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react'; // Updated for next-auth v4
import User from '../../models/User'; // Import the User model

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Define handler function for upload
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { filename, userId, fileHash, contentType } = JSON.parse(req.body);
  const fileSize = parseInt(req.headers['content-length'] || '0'); // Parse file size from headers

  try {
    // Fetch the user from the database using their email
    const user = await User.findOne({ where: { email: session.user?.email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user has enough storage
    if (user.currentStorage + fileSize > user.maxStorage) {
      return res.status(400).json({ error: 'Insufficient storage' });
    }

    // Proceed with file upload if storage is available
    const signedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: `${userId}/${fileHash}/${filename}`,  // Use the userId as a prefix in the Key
        ContentType: contentType,
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
