CREATE TABLE "LandingMetadata" (
    "renderId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "artifacts" JSONB NOT NULL,

    CONSTRAINT "LandingMetadata_pkey" PRIMARY KEY ("renderId")
);

CREATE TABLE "LandingEvent" (
    "id" TEXT NOT NULL,
    "renderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "LandingEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LandingMetadata_token_key" ON "LandingMetadata"("token");
CREATE INDEX "LandingEvent_renderId_occurredAt_idx" ON "LandingEvent"("renderId", "occurredAt");