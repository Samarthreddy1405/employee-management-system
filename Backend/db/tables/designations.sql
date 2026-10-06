--
-- Table: designations
--

CREATE TABLE designations (
    id              uuid            NOT NULL DEFAULT gen_random_uuid(),
    name            character varying(100)  NOT NULL,
    department_id   uuid            NOT NULL,
    created_on      timestamp(6) without time zone NOT NULL DEFAULT now(),
    updated_on      timestamp(6) without time zone NOT NULL DEFAULT now(),
    CONSTRAINT designations_pkey PRIMARY KEY (id),
    CONSTRAINT designations_dept_name_uq UNIQUE (department_id, name),
    CONSTRAINT fk_designations_department FOREIGN KEY (department_id)
        REFERENCES departments(id)
);

CREATE INDEX idx_designations_department_id ON designations USING btree (department_id);
