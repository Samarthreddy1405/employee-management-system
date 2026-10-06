--
-- Table: departments
--

CREATE TABLE departments (
    id          uuid            NOT NULL DEFAULT gen_random_uuid(),
    name        character varying(100)  NOT NULL,
    created_on  timestamp(6) without time zone NOT NULL DEFAULT now(),
    updated_on  timestamp(6) without time zone NOT NULL DEFAULT now(),
    CONSTRAINT departments_pkey PRIMARY KEY (id),
    CONSTRAINT uk_departments_name UNIQUE (name)
);

CREATE INDEX idx_departments_name ON departments USING btree (name);
