CREATE TABLE IF NOT EXISTS "adexec"."email_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient" text NOT NULL,
	"shipment_id" text,
	"kind" text NOT NULL,
	"payload" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"next_attempt" text NOT NULL,
	"lease" text,
	"provider_id" text,
	"last_error" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_outbox_pending_idx" ON "adexec"."email_outbox" USING btree ("status","next_attempt");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "adexec".queue_customer_email() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  shipment "adexec".shipments%ROWTYPE;
  destination_email text;
  shipment_id_value text;
  message_kind text;
  reference text;
  details jsonb;
  stamp text := to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF TG_TABLE_NAME='requests' THEN
    destination_email:=NEW.email;
    message_kind:='request'; reference:='request:'||NEW.id;
    details:=jsonb_build_object('reference',NEW.id);
  ELSE
    IF TG_TABLE_NAME='events' THEN
      SELECT * INTO STRICT shipment FROM "adexec".shipments WHERE id=NEW.shipment_id;
      IF TG_OP='UPDATE' THEN
        IF NEW.note IS NOT DISTINCT FROM OLD.note THEN RETURN NEW; END IF;
        message_kind:='correction'; reference:=gen_random_uuid()::text;
      ELSE
        message_kind:=CASE WHEN NEW.status='booked' AND NEW.note='Shipment booking confirmed.' THEN 'booking' ELSE 'milestone' END;
        reference:='event:'||NEW.id;
      END IF;
      details:=jsonb_build_object('status',NEW.status,'location',NEW.location,'note',NEW.note,'reported',NEW.created_at);
    ELSE
      shipment:=NEW;
      IF NEW.recipient_email IS DISTINCT FROM OLD.recipient_email THEN message_kind:='booking';
      ELSIF NEW.code IS DISTINCT FROM OLD.code THEN message_kind:='replacement';
      ELSIF NEW.eta IS DISTINCT FROM OLD.eta AND NEW.location_updated_at=OLD.location_updated_at THEN message_kind:='estimate';
      ELSE RETURN NEW; END IF;
      reference:=gen_random_uuid()::text;
      details:=jsonb_build_object('status',NEW.status,'location',NEW.current_location,'reported',stamp);
    END IF;
    destination_email:=shipment.recipient_email; shipment_id_value:=shipment.id;
    details:=details||jsonb_build_object('reference',shipment.code,'origin',shipment.origin,'destination',shipment.destination,'eta',shipment.eta);
  END IF;
  IF coalesce(trim(destination_email),'')<>'' THEN
    INSERT INTO "adexec".email_outbox(id,recipient,shipment_id,kind,payload,created_at,next_attempt)
    VALUES(reference,lower(trim(destination_email)),shipment_id_value,message_kind,details::text,stamp,stamp) ON CONFLICT(id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER email_request AFTER INSERT ON "adexec".requests FOR EACH ROW EXECUTE FUNCTION "adexec".queue_customer_email();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER email_milestone AFTER INSERT OR UPDATE OF note ON "adexec".events FOR EACH ROW EXECUTE FUNCTION "adexec".queue_customer_email();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER email_booking_change AFTER UPDATE OF code,recipient_email,eta ON "adexec".shipments FOR EACH ROW EXECUTE FUNCTION "adexec".queue_customer_email();
