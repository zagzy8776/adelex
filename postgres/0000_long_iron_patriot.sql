CREATE TABLE "adexec"."admins" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "admins_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "adexec"."events" (
	"id" text PRIMARY KEY NOT NULL,
	"shipment_id" text NOT NULL,
	"status" text NOT NULL,
	"location" text NOT NULL,
	"note" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"source" text DEFAULT 'admin' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adexec"."rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"hits" integer NOT NULL,
	"reset_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adexec"."requests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"service" text NOT NULL,
	"description" text NOT NULL,
	"weight" double precision NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adexec"."settings" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"business_hours" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adexec"."shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_email" text DEFAULT '' NOT NULL,
	"recipient_phone" text DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"service" text NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"origin_lat" double precision NOT NULL,
	"origin_lng" double precision NOT NULL,
	"destination_lat" double precision NOT NULL,
	"destination_lng" double precision NOT NULL,
	"current_lat" double precision NOT NULL,
	"current_lng" double precision NOT NULL,
	"current_location" text NOT NULL,
	"status" text DEFAULT 'booked' NOT NULL,
	"eta" text DEFAULT '' NOT NULL,
	"weight" double precision DEFAULT 0 NOT NULL,
	"pieces" integer DEFAULT 1 NOT NULL,
	"location_source" text DEFAULT 'admin' NOT NULL,
	"location_updated_at" text NOT NULL,
	"driver_token_hash" text,
	"driver_token_expires_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "shipments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "adexec"."events" ADD CONSTRAINT "events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "adexec"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_shipment_idx" ON "adexec"."events" USING btree ("shipment_id","created_at");--> statement-breakpoint
CREATE INDEX "shipments_created_idx" ON "adexec"."shipments" USING btree ("created_at");