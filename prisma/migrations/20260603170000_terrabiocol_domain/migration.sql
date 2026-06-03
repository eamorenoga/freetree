CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "TreeStatus" AS ENUM ('PURCHASED', 'PLANTED', 'GROWING', 'HEALTHY', 'NEEDS_ATTENTION', 'MATURE');

CREATE TABLE "AppRole" (
    "id" TEXT NOT NULL,
    "name" "Role" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TreeProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "estimatedKgCo2PerYear" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TreeProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TreePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "treeProductId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "TreeStatus" NOT NULL DEFAULT 'PURCHASED',
    "plantedAt" TIMESTAMP(3),
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TreePurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "treePurchaseId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SIMULATED',
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TreeTracking" (
    "id" TEXT NOT NULL,
    "treePurchaseId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "status" "TreeStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TreeTracking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TreePhoto" (
    "id" TEXT NOT NULL,
    "treeTrackingId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TreePhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "treePurchaseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CarbonFootprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "treePurchaseId" TEXT,
    "estimatedKgCo2" DOUBLE PRECISION NOT NULL,
    "accumulatedKgCo2" DOUBLE PRECISION NOT NULL,
    "calculationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "CarbonFootprint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUploadLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminUploadLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_treePurchaseId_key" ON "Payment"("treePurchaseId");
CREATE UNIQUE INDEX "AppRole_name_key" ON "AppRole"("name");
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
CREATE UNIQUE INDEX "QRCode_treePurchaseId_key" ON "QRCode"("treePurchaseId");
CREATE UNIQUE INDEX "QRCode_code_key" ON "QRCode"("code");
CREATE UNIQUE INDEX "CarbonFootprint_treePurchaseId_key" ON "CarbonFootprint"("treePurchaseId");

ALTER TABLE "TreePurchase" ADD CONSTRAINT "TreePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TreePurchase" ADD CONSTRAINT "TreePurchase_treeProductId_fkey" FOREIGN KEY ("treeProductId") REFERENCES "TreeProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_treePurchaseId_fkey" FOREIGN KEY ("treePurchaseId") REFERENCES "TreePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TreeTracking" ADD CONSTRAINT "TreeTracking_treePurchaseId_fkey" FOREIGN KEY ("treePurchaseId") REFERENCES "TreePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TreePhoto" ADD CONSTRAINT "TreePhoto_treeTrackingId_fkey" FOREIGN KEY ("treeTrackingId") REFERENCES "TreeTracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TreePhoto" ADD CONSTRAINT "TreePhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_treePurchaseId_fkey" FOREIGN KEY ("treePurchaseId") REFERENCES "TreePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CarbonFootprint" ADD CONSTRAINT "CarbonFootprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CarbonFootprint" ADD CONSTRAINT "CarbonFootprint_treePurchaseId_fkey" FOREIGN KEY ("treePurchaseId") REFERENCES "TreePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminUploadLog" ADD CONSTRAINT "AdminUploadLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
