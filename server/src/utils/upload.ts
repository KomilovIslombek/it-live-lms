import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";

export const UPLOAD_DIR = fileURLToPath(
  new URL("../../uploads/", import.meta.url),
);

const KINDS = {
  image: {
    exts: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    types: /^image\/(jpeg|png|webp|gif)$/,
    label: "an image (jpg, png, webp, gif)",
  },
  video: {
    exts: [".mp4", ".webm", ".mov"],
    types: /^video\/(mp4|webm|quicktime)$/,
    label: "a video (mp4, webm, mov)",
  },
  document: {
    exts: [
      ".pdf",
      ".zip",
      ".rar",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".txt",
      ".png",
      ".jpg",
      ".jpeg",
    ],
    types: /.*/,
    label:
      "a document (pdf, zip, rar, doc, docx, ppt, pptx, xls, xlsx, txt, png, jpg)",
  },
} as const;

type Kind = keyof typeof KINDS;

interface FieldRule {
  name: string;
  kind: Kind;
  folder: string;
  maxCount?: number;
}

export class UploadError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}

function makeUpload(rules: FieldRule[], maxSizeMb: number): RequestHandler {
  const ruleFor = new Map(rules.map((rule) => [rule.name, rule]));

  const parse = multer({
    storage: multer.diskStorage({
      destination: (_req, file, done) => {
        const folder = ruleFor.get(file.fieldname)?.folder ?? "other";
        const dir = path.join(UPLOAD_DIR, folder);
        mkdirSync(dir, { recursive: true });
        done(null, dir);
      },
      filename: (_req, file, done) => {
        done(
          null,
          randomUUID() + path.extname(file.originalname).toLowerCase(),
        );
      },
    }),
    limits: { fileSize: maxSizeMb * 1024 * 1024, files: 20 },
    fileFilter: (_req, file, done) => {
      const rule = ruleFor.get(file.fieldname);
      if (!rule) {
        return done(
          new UploadError(file.fieldname, "This field takes no file"),
        );
      }
      const kind = KINDS[rule.kind];
      const ext = path.extname(file.originalname).toLowerCase();
      if (
        !(kind.exts as readonly string[]).includes(ext) ||
        !kind.types.test(file.mimetype)
      ) {
        return done(new UploadError(rule.name, `Must be ${kind.label}`));
      }
      done(null, true);
    },
  }).fields(
    rules.map((rule) => ({ name: rule.name, maxCount: rule.maxCount ?? 1 })),
  );

  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) void deleteUploadedFiles(req);
    });
    parse(req, res, next);
  };
}

export const uploadCourseMedia = makeUpload(
  [
    { name: "banner", kind: "image", folder: "banners" },
    { name: "intro_video", kind: "video", folder: "videos" },
  ],
  500,
);

export const uploadLessonVideo = makeUpload(
  [{ name: "video", kind: "video", folder: "videos" }],
  500,
);

export const uploadAttachments = makeUpload(
  [{ name: "files", kind: "document", folder: "files", maxCount: 20 }],
  50,
);

export const uploadProfileImage = makeUpload(
  [{ name: "profile_img", kind: "image", folder: "avatars" }],
  5,
);

export function uploadedFiles(req: Request, field: string) {
  const files = req.files;
  if (!files || Array.isArray(files)) return [];
  return files[field] ?? [];
}

export function publicPath(file: Express.Multer.File) {
  const relative = path
    .relative(UPLOAD_DIR, file.path)
    .split(path.sep)
    .join("/");
  return `/uploads/${relative}`;
}

export function uploadedPath(req: Request, field: string) {
  const file = uploadedFiles(req, field)[0];
  return file ? publicPath(file) : undefined;
}

export function fileRows(req: Request, field: string) {
  return uploadedFiles(req, field).map((file) => ({
    file_name: file.originalname,
    file_path: publicPath(file),
    mime_type: file.mimetype,
    file_size: file.size,
  }));
}

async function deleteUploadedFiles(req: Request) {
  const files = req.files;
  if (!files) return;
  const list = Array.isArray(files) ? files : Object.values(files).flat();
  await Promise.all(list.map((file) => unlink(file.path).catch(() => {})));
}

export async function deleteStoredFile(storedPath: string | null | undefined) {
  if (!storedPath?.startsWith("/uploads/")) return;
  const full = path.join(UPLOAD_DIR, storedPath.slice("/uploads/".length));
  if (!full.startsWith(UPLOAD_DIR)) return;
  await unlink(full).catch(() => {});
}
