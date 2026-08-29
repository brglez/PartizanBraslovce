-- CreateTable
CREATE TABLE "HallSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "openingHour" INTEGER NOT NULL DEFAULT 8,
    "closingHour" INTEGER NOT NULL DEFAULT 22,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HallSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "HallSettings" ("id", "openingHour", "closingHour", "updatedAt")
VALUES (1, 8, 22, CURRENT_TIMESTAMP);
