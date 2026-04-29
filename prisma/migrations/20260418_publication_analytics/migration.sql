CREATE TABLE "LandingPublicationAccess" (
    "id" TEXT NOT NULL,
    "renderId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPublicationAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LandingMetricAggregate" (
    "key" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "bucketDate" TIMESTAMP(3) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "LandingMetricAggregate_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "LandingPublicationAccess_renderId_occurredAt_idx" ON "LandingPublicationAccess"("renderId", "occurredAt");
CREATE INDEX "LandingPublicationAccess_token_occurredAt_idx" ON "LandingPublicationAccess"("token", "occurredAt");
CREATE INDEX "LandingMetricAggregate_metricName_bucketDate_idx" ON "LandingMetricAggregate"("metricName", "bucketDate");
