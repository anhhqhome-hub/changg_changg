CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "founderName" TEXT,
    "founderTitle" TEXT,
    "founderTitleEn" TEXT,
    "founderQuote" TEXT,
    "founderQuoteEn" TEXT,
    "founderPhotoUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);
