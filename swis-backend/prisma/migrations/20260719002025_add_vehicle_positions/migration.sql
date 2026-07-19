-- CreateTable
CREATE TABLE "vehicle_positions" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "speed_kmh" DECIMAL(5,2) NOT NULL,
    "heading" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_positions_vehicle_id_key" ON "vehicle_positions"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_positions_vehicle_id_idx" ON "vehicle_positions"("vehicle_id");

-- AddForeignKey
ALTER TABLE "vehicle_positions" ADD CONSTRAINT "vehicle_positions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
