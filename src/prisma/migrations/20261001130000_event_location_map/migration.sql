-- Existing events keep their text location and have no map until one is added.
ALTER TABLE "Event" ADD COLUMN "locationMap" JSONB;
