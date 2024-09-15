import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { refreshToken } from '../../utils/auth'; // Import the refresh token utility

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }

    // Get JWT token from the Authorization header
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Token missing.' });
    }

    // Verify the JWT token using the secret key
    let decoded;
    let newToken = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Attempt to refresh the token
        newToken = await refreshToken();
        if (!newToken) {
          return res.status(403).json({ error: 'Token expired and refresh failed.' });
        }
        token = newToken;
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      } else {
        return res.status(403).json({ error: 'Invalid token.' });
      }
    }

    const { userId } = req.query;

    // Ensure userId comparison works (string comparison to avoid mismatches)
    if (String(decoded.user.id) !== String(userId)) {
      return res.status(403).json({ error: 'Unauthorized access to another user’s data.' });
    }

    // Initialize the S3 client
    const s3 = new AWS.S3({
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: 'auto',
      signatureVersion: 'v4',
    });

    const bucketName = process.env.R2_BUCKET_NAME;

    // Fetch the files for the specific user by using the userId as the Prefix
    const data = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: `${userId}/`, // Ensure only files under the user's directory are listed
    }).promise();

    if (!data.Contents || data.Contents.length === 0) {
      return res.status(200).json({ filesByFormat: {}, totalFiles: 0, totalSize: '0 MB' });
    }

    // Organize files by their format
    const filesByFormat = data.Contents.reduce((acc, item) => {
      const extension = item.Key.split('.').pop().toLowerCase();
      if (!acc[extension]) {
        acc[extension] = {
          files: [],
          totalSize: 0,
        };
      }
      const fileSizeMB = item.Size / 1024 / 1024;
      acc[extension].files.push({
        name: item.Key.replace(`${userId}/`, ''),
        size: `${fileSizeMB.toFixed(2)} MB`,
        url: s3.getSignedUrl('getObject', {
          Bucket: bucketName,
          Key: item.Key,
          Expires: 60 * 5, // URL valid for 5 minutes
        }),
      });
      acc[extension].totalSize += fileSizeMB;
      return acc;
    }, {});

    const totalFiles = data.Contents.length;
    const totalSizeMB = data.Contents.reduce((acc, item) => acc + item.Size, 0) / 1024 / 1024;

    // Return the files and storage info
    return res.status(200).json({
      filesByFormat,
      totalFiles,
      totalSize: `${totalSizeMB.toFixed(2)} MB`,
      ...(newToken ? { token: newToken } : {}), // Return new token if it was refreshed
    });
  } catch (error) {
    console.error('Error fetching files:', error.message);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
}
