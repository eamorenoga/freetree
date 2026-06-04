ALTER TABLE "TreeProduct"
ADD COLUMN "co2FactorPerMonth" DOUBLE PRECISION NOT NULL DEFAULT 10;

UPDATE "TreeProduct"
SET "co2FactorPerMonth" = GREATEST("estimatedKgCo2PerYear" / 12, 0.1);
