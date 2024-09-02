import React from "react";
import Uppy, { UppyFile, UploadResult } from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { Dashboard } from "@uppy/react";
import { sha256 } from "crypto-hash";

// Import Uppy styles
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

// Import your custom styles
import styles from "../styles/FileUploader.module.css";

interface FileUploaderProps {
  onUploadSuccess: (result: UploadResult) => void;
  userId: string;
}

export function FileUploader({ onUploadSuccess, userId }: FileUploaderProps) {
  const uppy = React.useMemo(() => {
    const uppy = new Uppy({
      autoProceed: false, // Wait for user to click "Upload" before starting
      restrictions: {
        maxFileSize: 1024 * 1024 * 2000, // 20MB
        allowedFileTypes: [
          "image/*",
          "application/pdf",
          "application/msword", // .doc files
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx files
          "text/csv", // .csv files
          "application/vnd.ms-excel", // .xls files
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx files
          "application/zip", // .zip files
          "application/x-zip-compressed", // Compressed .zip files
          "application/octet-stream", // .app files and other binary files
        ],
        maxNumberOfFiles: 5, // Allow up to 5 files at once
      },
    }).use(AwsS3, {
      getUploadParameters: async (file: UppyFile) => {
        const arrayBuffer = await new Response(file.data).arrayBuffer();
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            accept: "application/json",
          },
          body: JSON.stringify({
            userId,
            filename: file.name,
            fileHash: await sha256(arrayBuffer),
            contentType: file.type,
          }),
        });

        if (!response.ok) throw new Error("Unsuccessful request");

        const data = await response.json();
        return {
          method: data.method,
          url: data.url,
          fields: {},
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        };
      },
    });

    uppy.on("complete", (result) => {
      onUploadSuccess(result);
    });

    return uppy;
  }, [onUploadSuccess, userId]);

  return (
    <div className={styles.uploaderContainer}>
      <Dashboard
        uppy={uppy}
        proudlyDisplayPoweredByUppy={false} // Remove Uppy branding
        theme="dark"
        hideUploadButton={false} // Show the "Upload" button
        hideProgressAfterFinish={false}
        showProgressDetails={true}
        note="Images, PDFs, DOCX, ZIP, and APP files only, up to 20MB. Max 5 files."
        width={400}
        height={200}
        plugins={[]}
      />
    </div>
  );
}
