import AWS from 'aws-sdk';
import User from './../../models/User'; // Import the User model

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === 'GET') {
      // Initialize the S3 client
      const s3 = new AWS.S3({
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        region: 'auto',
        signatureVersion: 'v4',
      });

      const { userId } = req.query;
      const bucketName = process.env.R2_BUCKET_NAME;

      // Fetch the files for the specific user by using the userId as the Prefix
      const data = await s3.listObjectsV2({ 
        Bucket: bucketName,
        Prefix: `${userId}/`,  // This ensures that only files under the user's directory are listed
      }).promise();

      if (!data.Contents) {
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

      // Calculate total number of files and total size
      const totalFiles = data.Contents.length;
      const totalSizeMB = data.Contents.reduce((acc, item) => acc + item.Size, 0) / 1024 / 1024;

      // Update the currentStorage field in the database
      await User.update({ currentStorage: totalSizeMB }, { where: { id: userId } });

      res.status(200).json({
        filesByFormat,
        totalFiles,
        totalSize: `${totalSizeMB.toFixed(2)} MB`,
      });
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
}
