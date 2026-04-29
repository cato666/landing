CREATE TABLE "LandingArtifactManifest" (
    "renderId" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "inputPath" TEXT NOT NULL,
    "canonicalPath" TEXT NOT NULL,
    "htmlPath" TEXT NOT NULL,
    "metadataPath" TEXT NOT NULL,
    "eventsPath" TEXT NOT NULL,
    "pdfPath" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingArtifactManifest_pkey" PRIMARY KEY ("renderId")
);