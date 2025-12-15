import fs from "fs";
import path from "path";

import { MultipartFile } from "@fastify/multipart";
import { FastifyRequest, FastifyReply } from "fastify";

const uploadsPath = path.join(__dirname, "../../uploads");

// Helper to save multipart file
const saveFile = async (
  file: MultipartFile,
  fileDir: string = ""
): Promise<{ filename: string; path: string; mimetype: string; size: number }> => {
  const uploadFolder = path.join(uploadsPath, fileDir);

  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  const ext = path.extname(file.filename || "");
  const baseName = path.basename(file.filename || "", ext);
  let finalName = `${baseName}${ext}`;
  let counter = 1;

  // Increment filename if it already exists
  while (fs.existsSync(path.join(uploadFolder, finalName))) {
    finalName = `${baseName}${counter}${ext}`;
    counter++;
  }

  const filePath = path.join(uploadFolder, finalName);
  const buffer = await file.toBuffer();
  fs.writeFileSync(filePath, buffer);

  return {
    filename: finalName,
    path: filePath,
    mimetype: file.mimetype || "",
    size: buffer.length,
  };
};

// Single file upload handler
const uploadSingle = (fieldName: string = "file") => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const data = await request.saveRequestFiles();
    const file = data[0];

    if (file) {
      const fileDir = (request.body as any)?.fileDir || "";
      const savedFile = await saveFile(file, fileDir);
      (request as any).file = {
        ...savedFile,
        originalname: file.filename,
        fieldname: fieldName,
      };
    }
  };
};

// Multiple files upload handler
const uploadArray = (fieldName: string = "files") => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const data = await request.saveRequestFiles();
    const files: any[] = [];

    for (const file of data) {
      if (file.fieldname === fieldName) {
        const fileDir = (request.body as any)?.fileDir || "";
        const savedFile = await saveFile(file, fileDir);
        files.push({
          ...savedFile,
          originalname: file.filename,
          fieldname: file.fieldname,
        });
      }
    }

    (request as any).files = files;
  };
};

export const upload = {
  single: uploadSingle,
  array: uploadArray,
};

// Improvement commit 26
