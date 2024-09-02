import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextApiRequest, NextApiResponse } from "next";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({ error: "File name is required" });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName as string,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // Expires in 1 hour

    res.status(200).json({ url: signedUrl });
  } catch (error) {
    console.error("Error generating signed URL", error);
    res.status(500).json({ error: "Failed to generate shareable link" });
  }
}
