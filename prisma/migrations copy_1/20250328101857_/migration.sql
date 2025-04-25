-- DropIndex
DROP INDEX "Studio_title_key";

-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "locationId" INTEGER;

-- CreateTable
CREATE TABLE "TicketDownload" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "downloaded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TicketDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketDownload_ticketId_key" ON "TicketDownload"("ticketId");

-- AddForeignKey
ALTER TABLE "TicketDownload" ADD CONSTRAINT "TicketDownload_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Studio" ADD CONSTRAINT "Studio_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
