ALTER TABLE "LandingArtifactManifest"
ADD COLUMN "storageBackend" TEXT NOT NULL DEFAULT 'filesystem',
ADD COLUMN "inputContentType" TEXT NOT NULL DEFAULT 'application/json',
ADD COLUMN "canonicalContentType" TEXT NOT NULL DEFAULT 'application/json',
ADD COLUMN "htmlContentType" TEXT NOT NULL DEFAULT 'text/html; charset=utf-8',
ADD COLUMN "metadataContentType" TEXT NOT NULL DEFAULT 'application/json',
ADD COLUMN "eventsContentType" TEXT NOT NULL DEFAULT 'application/json',
ADD COLUMN "pdfContentType" TEXT;