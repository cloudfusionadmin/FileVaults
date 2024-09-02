// pages/api/deleteFile.js

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  try {
    if (req.method === 'DELETE') {
      const { name, userId } = req.query;

      // Check environment variables
      //console.log("R2_ACCOUNT_ID:", process.env.R2_ACCOUNT_ID);
      //console.log("R2_ACCESS_KEY_ID:", process.env.R2_ACCESS_KEY_ID);
      //console.log("R2_SECRET_ACCESS_KEY:", process.env.R2_SECRET_ACCESS_KEY);

      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });

      // Construct the correct S3 key using userId and file name
      const key = `${userId}/${name}`;

      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      });

      await s3.send(command);

      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res.setHeader('Allow', ['DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}















