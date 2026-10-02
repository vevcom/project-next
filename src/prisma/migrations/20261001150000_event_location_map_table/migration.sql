BEGIN;

CREATE TYPE "MapProvider" AS ENUM ('MAZEMAP', 'OPENSTREETMAP');

CREATE TABLE "EventLocationMap" (
    "eventId" INTEGER NOT NULL,
    "provider" "MapProvider" NOT NULL,
    "url" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "EventLocationMap_pkey" PRIMARY KEY ("eventId"),
    CONSTRAINT "EventLocationMap_provider_fields_check" CHECK (
        ("provider" = 'MAZEMAP' AND "url" IS NOT NULL AND "latitude" IS NULL AND "longitude" IS NULL)
        OR
        ("provider" = 'OPENSTREETMAP' AND "url" IS NULL
            AND "latitude" IS NOT NULL AND "latitude" BETWEEN -85 AND 85
            AND "longitude" IS NOT NULL AND "longitude" BETWEEN -180 AND 180)
    )
);

ALTER TABLE "EventLocationMap" ADD CONSTRAINT "EventLocationMap_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve maps already saved by the JSON implementation before removing the old column.
INSERT INTO "EventLocationMap" ("eventId", "provider", "url", "latitude", "longitude")
SELECT "id", ("locationMap"->>'provider')::"MapProvider",
    "locationMap"->>'url',
    ("locationMap"->>'latitude')::DOUBLE PRECISION,
    ("locationMap"->>'longitude')::DOUBLE PRECISION
FROM "Event"
WHERE "locationMap" IS NOT NULL AND "locationMap" <> 'null'::JSONB;

ALTER TABLE "Event" DROP COLUMN "locationMap";

COMMIT;
