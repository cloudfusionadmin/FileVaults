import React from "react";
import Uppy, { type UploadResult } from "@uppy/core";
import { Dashboard } from "@uppy/react";
import { sha256 } from "crypto-hash";
import AwsS3Multipart from "@uppy/aws-s3-multipart";

// Uppy styles
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

const fetchUploadApiEndpoint = async (endpoint: string, data: any) => {
  const res = await fetch(`/api/multipart-upload/${endpoint}`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      authorization: `Bearer ${localStorage.getItem('token')}`, // Include authorization header
    },
    credentials: 'include', // Include cookies with the request
  });

  if (!res.ok) {
    throw new Error(`Error fetching ${endpoint}: ${res.statusText}`);
  }

  return res.json();
};

export function MultipartFileUploader({
  onUploadSuccess,
}: {
  onUploadSuccess: (result: UploadResult) => void;
}) {
  const uppy = React.useMemo(() => {
    const uppy = new Uppy({
      autoProceed: false, // Users must manually start the upload
      restrictions: {
        maxNumberOfFiles: 10, // Limit to 10 files at once
        maxFileSize: 10000000, // Limit to 10 MB per file
        allowedFileTypes: ['image/*', '.pdf'], // Allow images and PDFs only
      },
    }).use(AwsS3Multipart, {
      createMultipartUpload: async (file) => {
        const arrayBuffer = await new Response(file.data).arrayBuffer();
        const fileHash = await sha256(arrayBuffer);
        const contentType = file.type;
        return fetchUploadApiEndpoint("create-multipart-upload", {
          file,
          fileHash,
          contentType,
        });
      },
      listParts: (file, props) =>
        fetchUploadApiEndpoint("list-parts", { file, ...props }),
      signPart: (file, props) =>
        fetchUploadApiEndpoint("sign-part", { file, ...props }),
      abortMultipartUpload: (file, props) =>
        fetchUploadApiEndpoint("abort-multipart-upload", { file, ...props }),
      completeMultipartUpload: (file, props) =>
        fetchUploadApiEndpoint("complete-multipart-upload", { file, ...props }),
    });

    // Event listeners for upload progress and completion
    uppy.on("complete", (result) => {
      onUploadSuccess(result);
    });
    uppy.on("upload-success", (file, response) => {
      uppy.setFileState(file.id, {
        progress: uppy.getState().files[file.id].progress,
        uploadURL: response.body.Location,
        response: response,
        isPaused: false,
      });
    });

    return uppy;
  }, [onUploadSuccess]);

  return <Dashboard uppy={uppy} showLinkToFileUploadResult={true} />;
}
