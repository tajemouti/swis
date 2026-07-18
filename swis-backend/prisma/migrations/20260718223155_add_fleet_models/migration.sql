-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'OFFLINE', 'RETIRED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity_kg" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "vehicle_type_id" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_mileage" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fuel_capacity" DECIMAL(10,2) NOT NULL,
    "purchase_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "license_expiry" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_violations" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_types_name_key" ON "vehicle_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "vehicles"("plate_number");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_type_id_idx" ON "vehicles"("vehicle_type_id");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");

-- CreateIndex
CREATE INDEX "drivers_status_idx" ON "drivers"("status");

-- CreateIndex
CREATE INDEX "driver_violations_driver_id_idx" ON "driver_violations"("driver_id");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_violations" ADD CONSTRAINT "driver_violations_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
