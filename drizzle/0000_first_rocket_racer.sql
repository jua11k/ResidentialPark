CREATE SCHEMA "residential_park";
--> statement-breakpoint
CREATE TABLE "residential_park"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"action" varchar(50) NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"ip_address" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residential_park"."import_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"complex_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"success_rows" integer DEFAULT 0 NOT NULL,
	"error_rows" integer DEFAULT 0 NOT NULL,
	"errors_detail" jsonb DEFAULT '[]'::jsonb,
	"imported_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residential_park"."parking_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"complex_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"apartment_id" uuid NOT NULL,
	"registered_by" uuid,
	"entry_time" timestamp with time zone DEFAULT now() NOT NULL,
	"exit_time" timestamp with time zone,
	"status" varchar(20) DEFAULT 'inside' NOT NULL,
	"observations" text,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "residential_park"."apartments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"complex_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"floor" integer,
	"owner_name" varchar(255),
	"owner_phone" varchar(50),
	"owner_email" varchar(255),
	"parking_occupied" boolean DEFAULT false NOT NULL,
	"max_vehicles" integer DEFAULT 2 NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "residential_park"."blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"complex_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"total_floors" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "residential_park"."residential_complexes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500),
	"city" varchar(100),
	"nit" varchar(50),
	"phone" varchar(50),
	"email" varchar(255),
	"total_parking_spots" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "residential_park"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active" boolean DEFAULT true,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "residential_park"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'operator' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "residential_park"."vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"complex_id" uuid NOT NULL,
	"apartment_id" uuid NOT NULL,
	"placa" varchar(20) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"brand" varchar(100),
	"color" varchar(50),
	"model" varchar(100),
	"owner_name" varchar(255),
	"owner_phone" varchar(50),
	"owner_email" varchar(255),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "residential_park"."audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "residential_park"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "residential_park"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."import_logs" ADD CONSTRAINT "import_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "residential_park"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."import_logs" ADD CONSTRAINT "import_logs_complex_id_residential_complexes_id_fk" FOREIGN KEY ("complex_id") REFERENCES "residential_park"."residential_complexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."import_logs" ADD CONSTRAINT "import_logs_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "residential_park"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."parking_records" ADD CONSTRAINT "parking_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "residential_park"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."parking_records" ADD CONSTRAINT "parking_records_complex_id_residential_complexes_id_fk" FOREIGN KEY ("complex_id") REFERENCES "residential_park"."residential_complexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."parking_records" ADD CONSTRAINT "parking_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "residential_park"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."parking_records" ADD CONSTRAINT "parking_records_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "residential_park"."apartments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."parking_records" ADD CONSTRAINT "parking_records_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "residential_park"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."apartments" ADD CONSTRAINT "apartments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "residential_park"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."apartments" ADD CONSTRAINT "apartments_complex_id_residential_complexes_id_fk" FOREIGN KEY ("complex_id") REFERENCES "residential_park"."residential_complexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."apartments" ADD CONSTRAINT "apartments_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "residential_park"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."blocks" ADD CONSTRAINT "blocks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "residential_park"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."blocks" ADD CONSTRAINT "blocks_complex_id_residential_complexes_id_fk" FOREIGN KEY ("complex_id") REFERENCES "residential_park"."residential_complexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."residential_complexes" ADD CONSTRAINT "residential_complexes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "residential_park"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "residential_park"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."vehicles" ADD CONSTRAINT "vehicles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "residential_park"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."vehicles" ADD CONSTRAINT "vehicles_complex_id_residential_complexes_id_fk" FOREIGN KEY ("complex_id") REFERENCES "residential_park"."residential_complexes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residential_park"."vehicles" ADD CONSTRAINT "vehicles_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "residential_park"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_idx" ON "residential_park"."audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_entity_idx" ON "residential_park"."audit_logs" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "import_logs_tenant_idx" ON "residential_park"."import_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "records_tenant_status_idx" ON "residential_park"."parking_records" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "records_tenant_entry_idx" ON "residential_park"."parking_records" USING btree ("tenant_id","entry_time");--> statement-breakpoint
CREATE INDEX "records_vehicle_status_idx" ON "residential_park"."parking_records" USING btree ("vehicle_id","status");--> statement-breakpoint
CREATE INDEX "records_apartment_status_idx" ON "residential_park"."parking_records" USING btree ("apartment_id","status");--> statement-breakpoint
CREATE INDEX "apartments_tenant_complex_idx" ON "residential_park"."apartments" USING btree ("tenant_id","complex_id");--> statement-breakpoint
CREATE INDEX "apartments_tenant_block_idx" ON "residential_park"."apartments" USING btree ("tenant_id","block_id");--> statement-breakpoint
CREATE UNIQUE INDEX "apartments_block_number_idx" ON "residential_park"."apartments" USING btree ("block_id","number");--> statement-breakpoint
CREATE INDEX "blocks_tenant_complex_idx" ON "residential_park"."blocks" USING btree ("tenant_id","complex_id");--> statement-breakpoint
CREATE INDEX "complexes_tenant_idx" ON "residential_park"."residential_complexes" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_email_idx" ON "residential_park"."users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_tenant_placa_idx" ON "residential_park"."vehicles" USING btree ("tenant_id","placa");--> statement-breakpoint
CREATE INDEX "vehicles_apartment_idx" ON "residential_park"."vehicles" USING btree ("apartment_id");