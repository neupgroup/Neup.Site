/*
::neup.documentation::add-member-order-migration

::public

Adds an optional display order column to persisted member records.

::public end
::end
*/

ALTER TABLE "members" ADD COLUMN "order" INTEGER;
