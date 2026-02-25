# AWS S3 PDF Storage – Full Implementation Plan

This document outlines how to store user-uploaded PDFs in AWS S3 and integrate with the existing Paply (Richie) import flow. The app already has PDF import (metadata extraction via Genkit/Gemini) and a `papers.pdf_url` column; this plan adds S3 upload and persistence of that URL.

---

## 1. Current behavior (no S3)

- **Import (PDF tab):** User selects a PDF → file is read as a base64 data URI in the browser → `importPaperFromPdf({ pdfDataUri })` server action runs → Genkit extracts metadata (title, authors, year, journal, abstract, doi) → `onPaperImported(paperDetails)` is called with that metadata.
- **Persistence:** `handlePaperImport` POSTs to `/api/papers` with the extracted data. The papers table has `pdf_url` and the API accepts `pdfUrl`; today no PDF is stored anywhere, so `pdf_url` is empty for PDF imports.
- **Goal:** Upload the PDF to S3, get a URL, and pass that URL as `pdfUrl` when creating the paper so `pdf_url` is set and the “PDF URL” link in the UI works.

---

## 2. Architecture overview

- **Upload path:** Keep a single server-side flow: browser sends the PDF (e.g. base64 or `FormData`) to the backend; backend uploads to S3, then runs metadata extraction and returns metadata + `pdfUrl` so the client can call the existing `onPaperImported` with `pdfUrl` set.
- **Alternative (presigned URL):** Client gets a presigned PUT URL from an API route, uploads directly to S3, then calls an action/API with the resulting key/path so the server can build the public URL and run extraction if needed. This reduces server memory and is better for very large files; can be Phase 2.
- **Recommended for first version:** Server-side upload (simplest and consistent with current “send PDF to server for extraction” flow).

---

## 3. AWS setup

### 3.1 Create S3 bucket

- In **AWS Console** → S3 → Create bucket.
- **Bucket name:** e.g. `paply-pdfs-<account-id>` or `paply-pdfs-<env>` (must be globally unique).
- **Region:** Same as your app or nearest to users (e.g. `us-east-1`).
- **Block Public Access:**  
  - If you use **public read** URLs: uncheck “Block all public access” and add a bucket policy that allows `s3:GetObject` for your bucket (and optionally restrict by prefix).  
  - If you use **presigned URLs** for read: leave block public access on and do not expose objects publicly.
- **Versioning:** Optional; enable if you want to keep previous PDF versions.
- **Encryption:** Prefer SSE-S3 or SSE-KMS (default encryption on bucket).

### 3.2 Object key structure

Use a clear prefix and key pattern so you can add lifecycle/cleanup and access rules later:

- Pattern: `uploads/{userId}/{paperId}/{filename}.pdf`  
  or: `uploads/{userId}/{uuid}.pdf` (if paper doesn’t exist yet, use a temporary id/uuid and optionally move/rename after paper creation).
- Prefer **userId** in the path (from Clerk) so you can scope IAM policies and lifecycle rules per user.
- Example: `uploads/user_2abc123/550e8400-e29b-41d4-a716-446655440000/paper.pdf`.

### 3.3 IAM user or role for the app

- Create an **IAM user** (or use a role if running on AWS infra) for the Next.js app.
- **Permissions:** Attach a custom policy or use a policy like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
    }
  ]
}
```

- Create **access keys** for this user. You will put the key id and secret in env (e.g. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`); never commit them.

### 3.4 CORS (if using presigned client upload later)

In S3 → Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:9002"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## 4. Application implementation

### 4.1 Dependencies

- Install the AWS SDK for JavaScript (v3) S3 client:

```bash
npm install @aws-sdk/client-s3
```

- No need for `@aws-sdk/lib-storage` unless you want multipart upload for very large files later.

### 4.2 Environment variables

Add to `.env.local` (and to your deployment env, e.g. Vercel):

```env
# AWS S3 for PDF storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_PDF_BUCKET=paply-pdfs-your-account-id
# Optional: custom domain or CDN for PDF URLs (if you use one)
# NEXT_PUBLIC_PDF_CDN_BASE=https://pdfs.yourdomain.com
```

- Do **not** commit real keys; use placeholders in docs and set real values in CI/deploy.

### 4.3 S3 client and upload helper

- **File:** `src/lib/s3.ts` (or `src/lib/aws/s3.ts`).

- **Contents:**
  - Create and export an S3 client using `@aws-sdk/client-s3` and env vars (`AWS_REGION`, credentials from env or default provider).
  - Export a function, e.g. `uploadPdfToS3(params: { userId: string; paperIdOrUuid: string; file: Buffer; contentType?: string; filename?: string })` that:
    - Builds key: `uploads/{userId}/{paperIdOrUuid}/{sanitizedFilename}.pdf`.
    - Calls `PutObject` with `Body: file`, `ContentType: contentType || 'application/pdf'`, `Bucket` from env.
    - Returns the **public URL** of the object (if bucket is public) or a **presigned GET URL** (if private). Prefer one approach consistently; for “PDF URL” link in the UI, either:
      - Public URL: `https://${bucket}.s3.${region}.amazonaws.com/${key}` (and set bucket policy so these objects are readable), or
      - Presigned URL: generate with `getSignedUrl(getObject, ...)` with expiry (e.g. 7 days) and store that, or store only the key and generate presigned URL when the user clicks “PDF URL” (recommended for private buckets).
  - Sanitize `filename` (strip path, allow only safe chars) to avoid path traversal and broken keys.

### 4.4 Upload API route (server-side upload option)

- **File:** `src/app/api/upload-pdf/route.ts`.

- **Behavior:**
  - Method: `POST`.
  - Auth: require Clerk auth (e.g. `auth()` from `@clerk/nextjs/server`); reject if not signed in.
  - Body: `FormData` with a single file field (e.g. `file`), or JSON with a base64 PDF (if you keep the current client behavior and only add S3).
  - Validate: file type `application/pdf`, size limit (e.g. 10 MB) to match the UI.
  - Generate a temporary id (e.g. `crypto.randomUUID()`) for the object key if the paper doesn’t exist yet.
  - Call the S3 upload helper with `userId` from Clerk, the temp id (or `paperId` if you create paper first), and the file buffer.
  - Return JSON: `{ pdfUrl: string, key?: string }` so the client can pass `pdfUrl` into the rest of the import flow.

- **Flow choice:**
  - **Option A (recommended):** Client sends PDF once to this route → server uploads to S3 and returns `pdfUrl` → client calls `importPaperFromPdf` with the same PDF (as data URI) for extraction, then calls `onPaperImported` with extracted metadata **and** the `pdfUrl` from the upload response.
  - **Option B:** Single server action that accepts PDF (e.g. base64), uploads to S3, runs extraction, and returns both metadata and `pdfUrl`; client then calls `onPaperImported` with that combined payload. This avoids a second upload and keeps one round-trip for the PDF.

### 4.5 Server action changes (Option B – single round-trip)

- **File:** `src/app/actions.ts`.

- Add (or reuse) a server action that:
  - Accepts `{ pdfDataUri: string }` (and optionally a hint filename).
  - Decodes the data URI to a `Buffer`.
  - Generates a UUID for the S3 key (paper id not known yet).
  - Gets `userId` from Clerk; if missing, throws.
  - Calls the S3 upload helper to upload the buffer; gets back `pdfUrl` (or key and builds URL).
  - Calls existing `extractPaperDetailsFromPdf({ pdfDataUri })` to get metadata.
  - Returns an object that matches what `onPaperImported` expects: all extracted fields (title, authors, year, journal, abstract, doi) **plus** `pdfUrl`, and optionally `summary: []` (or run summary in background later). Map `journal` → `publisher` if your `Paper` type and API expect `publisher`.

- Keep `importPaperFromPdf` as the single entry; extend it to do upload then extraction and return metadata + `pdfUrl`.

### 4.6 Frontend changes

- **File:** `src/components/import-dialog.tsx`.

- **Current:** Reads file as data URI, calls `importPaperFromPdf({ pdfDataUri })`, then `onPaperImported(paperDetails)` with the result (which today has no `pdfUrl`).
- **Change:** No change if you implement Option B in the action (action returns `pdfUrl` and client just passes it through). Ensure the object passed to `onPaperImported` includes `pdfUrl` so that `handlePaperImport` sends it in the POST body to `/api/papers`.
- If you use Option A (separate upload route): call `POST /api/upload-pdf` with the file, get `pdfUrl`, then call `importPaperFromPdf` and merge `pdfUrl` into the result before `onPaperImported`.

- **File:** `src/components/richie-workspace.tsx` and **`src/app/api/papers/route.ts`**.

- Already support `pdfUrl` in the payload and DB; no change needed except ensuring the import path always sends `pdfUrl` when it’s a PDF upload.

### 4.7 Mapping extraction output to Paper and API

- Extraction returns `journal`; your DB has `publisher`. In the server action or in the client, map `journal` → `publisher` when building the object for `onPaperImported` / POST `/api/papers`, so the journal name is stored in `publisher` (or add a `journal` column later if you prefer).
- Ensure default `summary` (e.g. `[]`) and `pdfUrl` (from S3) are set so the created paper row is valid.

### 4.8 Security and validation

- **Auth:** Every upload and S3 key must be scoped to the authenticated `userId` (Clerk).
- **File type:** Allow only `application/pdf` (check `Content-Type` and/or magic bytes).
- **Size:** Enforce a limit (e.g. 10 MB) in the API route and in the action.
- **Key sanitization:** Prevent path traversal in filenames; use a whitelist of characters for the filename part of the key.
- **Rate limiting:** Consider rate limiting the upload endpoint to avoid abuse (e.g. Vercel or middleware).

### 4.9 Optional: presigned read URLs (private bucket)

- If the bucket is private, store only the S3 **key** in `papers.pdf_url` (or in a dedicated column like `pdf_s3_key`) and resolve the URL when needed:
  - **Option 1:** API route `GET /api/papers/[id]/pdf-url` that checks auth, loads the paper, verifies the user owns it, generates a presigned GET URL for the stored key (e.g. 1-hour expiry), and redirects or returns `{ url }`.
  - **Option 2:** Store a long-lived presigned URL (e.g. 7 days) and refresh it when the user opens the details pane (more complex).
- UI: “PDF URL” link would call this API or open the presigned URL so users never see raw keys.

### 4.10 Optional: delete PDF when paper is deleted

- In `DELETE /api/papers/[paperId]` (or equivalent), after deleting the paper row, get the stored `pdf_url` or `pdf_s3_key`, parse the key from the URL or use the key column, and call `DeleteObject` for that key. Handle “key not found” gracefully. This keeps S3 from accumulating orphaned files.

---

## 5. Implementation checklist

- [ ] **AWS**
  - [ ] Create S3 bucket and set region, encryption, and (if public) bucket policy.
  - [ ] Define object key format: `uploads/{userId}/{id}.pdf` (or with filename).
  - [ ] Create IAM user/role with PutObject/GetObject/DeleteObject on `uploads/*`.
  - [ ] Add CORS if you will use client-side presigned upload later.
- [ ] **App**
  - [ ] Add `@aws-sdk/client-s3` and env vars (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_PDF_BUCKET`).
  - [ ] Implement `src/lib/s3.ts`: S3 client + `uploadPdfToS3` (and optionally a small helper to build public or presigned URL).
  - [ ] Extend `importPaperFromPdf` in `src/app/actions.ts`: decode data URI → upload to S3 → extract metadata → return metadata + `pdfUrl`; map `journal` → `publisher` and set `summary`/defaults as needed.
  - [ ] Ensure `import-dialog.tsx` passes the returned `pdfUrl` through to `onPaperImported` (no change if action already returns it).
  - [ ] Confirm POST `/api/papers` and PATCH `/api/papers/[id]` persist `pdf_url` (already implemented).
- [ ] **Security**
  - [ ] Validate PDF content type and size (e.g. 10 MB) in the action or upload route.
  - [ ] Sanitize filename for S3 key; scope keys by `userId`.
- [ ] **Optional**
  - [ ] Presigned read URL endpoint if bucket is private.
  - [ ] Delete S3 object when a paper is deleted.
  - [ ] Later: client-side upload via presigned PUT if you want to avoid sending large PDFs through the server.

---

## 6. File summary

| File | Action |
|------|--------|
| `docs/s3-pdf-storage-implementation-plan.md` | This plan (create/update). |
| `.env.local` | Add AWS_* and bucket name. |
| `package.json` | Add `@aws-sdk/client-s3`. |
| `src/lib/s3.ts` | **New:** S3 client + `uploadPdfToS3`, URL builder/presigned helper. |
| `src/app/actions.ts` | **Modify:** `importPaperFromPdf` → upload to S3, then extract; return metadata + `pdfUrl`. |
| `src/components/import-dialog.tsx` | **Minimal:** Ensure `pdfUrl` from action is included in payload to `onPaperImported`. |
| `src/app/api/papers/[paperId]/route.ts` | **Optional:** In DELETE, remove S3 object if you store key/URL. |
| `src/app/api/upload-pdf/route.ts` | **Optional:** Only if you choose Option A (separate upload endpoint). |

---

## 7. Order of implementation

1. AWS: bucket, IAM, env vars.
2. `src/lib/s3.ts`: client and upload helper.
3. `src/app/actions.ts`: integrate S3 upload into `importPaperFromPdf` and return `pdfUrl`.
4. Frontend: ensure `pdfUrl` is passed to `onPaperImported` and saved.
5. Test: PDF import → paper created with `pdf_url` → “PDF URL” opens the file.
6. Optional: presigned URL for private bucket, and S3 delete on paper delete.

This gives you a full path from user upload to stored PDF in S3 and a working `pdf_url` in the app.

---

## 8. Private bucket (implemented)

When the bucket is **private**, the app uses presigned URLs for both upload and read:

- **Storage:** `papers.pdf_url` stores the **S3 object key** (e.g. `uploads/user_2abc/uuid.pdf`). Key format is **flat**: `uploads/{userId}/{uuid}.pdf`.
- **Upload (client-side presigned PUT):** Large PDFs never go through the server.
  1. Client requests a presigned PUT URL: `POST /api/upload-pdf/presigned-url` with `{ size }` (optional). Server returns `{ putUrl, key }`.
  2. Client uploads the file directly to S3 with `PUT putUrl` and `Content-Type: application/pdf`. **S3 CORS must allow your app origin and method PUT** (see §3.4).
  3. Client calls `importPaperFromPdfWithKey({ key })`. Server fetches the PDF from S3, runs extraction, returns metadata and stores `key` as `pdf_url`. If extraction fails, the server deletes the orphan object from S3.
- **Legacy (server-side):** `importPaperFromPdf({ pdfDataUri })` still does upload-first then extract (PDF is sent to the server; server uploads to S3). Use presigned flow in the UI to avoid server bandwidth.
- **Access:** `GET /api/papers/[paperId]/pdf-url` redirects to a **presigned GET URL** (1-hour) for our keys, or to the raw URL for external links.
- **Delete:** DELETE paper removes the S3 object when `pdf_url` is our key.
- **CORS:** For client-side PUT to S3, the bucket CORS must include your app origin (e.g. `http://localhost:9002`, `https://yourdomain.com`) and `AllowedMethods: ["PUT", "GET"]`.
