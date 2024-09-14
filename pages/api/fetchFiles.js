import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken'; // For verifying JWT
import User from '../../models/User'; // Import the User model
import { refreshToken } from '../../utils/auth'; // Import refreshToken utility

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }

    // Get JWT token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      console.error('Authorization header missing.');
      return res.status(401).json({ error: 'Unauthorized. Authorization header missing.' });
    }

    let token = authHeader && authHeader.split(' ')[1]; // Extract token
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Token missing.' });
    }

    let decoded;
    let newToken = null;

    try {
      // Verify the JWT token using the secret key
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Try to refresh the token
        newToken = await refreshToken();
        if (!newToken) {
          return res.status(403).json({ error: 'Token expired and refresh failed.' });
        }
        // Use the new token for this request
        token = newToken;
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Verify the new token
      } else {
        return res.status(403).json({ error: 'Invalid token.' });
      }
    }

    const { userId } = req.query;

    // Check if the userId from the token matches the userId passed in the query
    if (decoded.user.id !== userId) {
      console.error('Unauthorized access to another user’s data.');
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
      Prefix: `${userId}/`, // This ensures that only files under the user's directory are listed
    }).promise();

    if (!data.Contents || data.Contents.length === 0) {
      return res.status(200).json({ filesByFormat: {}, totalFiles: 0, totalSize: '0 MB' });
    }

    // Organize files by their format
    const filesByFormat = data.Contents.reduce((acc, item) => {
      const extension = item.Key.split('.').pop().toLowerCase(); // Get file extension
      if (!acc[extension]) {
        acc[extension] = {
          files: [],
          totalSize: 0,
        };
      }
      const fileSizeMB = item.Size / 1024 / 1024;
      acc[extension].files.push({
        name: item.Key.replace(`${userId}/`, ''), // Remove the userId prefix from the file name
        size: `${fileSizeMB.toFixed(2)} MB`, // Adjust to 2 decimal places for better readability
        url: s3.getSignedUrl('getObject', {
          Bucket: bucketName,
          Key: item.Key,
          Expires: 60 * 5, // URL valid for 5 minutes
        }),
      });
      acc[extension].totalSize += fileSizeMB;
      return acc;
    }, {});

    // Calculate total number of files and total size
    const totalFiles = data.Contents.length;
    const totalSizeMB = data.Contents.reduce((acc, item) => acc + item.Size, 0) / 1024 / 1024;

    // Convert totalSizeMB to bytes for storing in the database
    const totalSizeBytes = Math.round(totalSizeMB * 1024 * 1024); // Convert MB to bytes and round to integer

    // Update the currentStorage field in the database (storing as bytes)
    await User.update({ currentStorage: totalSizeBytes }, { where: { id: userId } });

    // Respond with the files and storage info
    return res.status(200).json({
      filesByFormat,
      totalFiles,
      totalSize: `${totalSizeMB.toFixed(2)} MB`, // Total size in MB
      ...(newToken ? { token: newToken } : {}), // Send the new token back to the client if it was refreshed
    });
  } catch (error) {
    console.error('Error fetching files:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
}
