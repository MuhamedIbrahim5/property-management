-- Add latitude and longitude to Property
ALTER TABLE "Property" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "longitude" DOUBLE PRECISION;

-- Add autoUrgent to MaintenanceType
ALTER TABLE "MaintenanceType" ADD COLUMN "autoUrgent" BOOLEAN NOT NULL DEFAULT false;

-- Add isDelayed flag to MaintenanceRequest
ALTER TABLE "MaintenanceRequest" ADD COLUMN "isDelayed" BOOLEAN NOT NULL DEFAULT false;

-- Add category to Attachment
ALTER TABLE "Attachment" ADD COLUMN "category" TEXT DEFAULT 'general';

-- Create FieldVisit table
CREATE TABLE "FieldVisit" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "locationError" TEXT,
    "distanceMeters" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldVisit_pkey" PRIMARY KEY ("id")
);

-- Add indexes for FieldVisit
CREATE INDEX "FieldVisit_requestId_idx" ON "FieldVisit"("requestId");
CREATE INDEX "FieldVisit_userId_idx" ON "FieldVisit"("userId");

-- Add foreign keys for FieldVisit
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE;

-- Add index for isDelayed in MaintenanceRequest
CREATE INDEX "MaintenanceRequest_isDelayed_idx" ON "MaintenanceRequest"("isDelayed");
