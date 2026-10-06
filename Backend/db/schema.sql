--
-- PostgreSQL database dump
--

\restrict dx76C5eC2eWStAaZeg9yNy0Bzi9iRwODHli3ckQenvLi6ZVY0j9ONpSFKwuRaY2

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    created_on timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_on timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    department_id uuid NOT NULL,
    created_on timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_on timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid NOT NULL,
    org_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    metadata jsonb,
    created_on timestamp without time zone NOT NULL,
    updated_on timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    department_id uuid,
    designation_id uuid
);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: designations designations_dept_name_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_dept_name_uq UNIQUE (department_id, name);


--
-- Name: designations designations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: departments uk_departments_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT uk_departments_name UNIQUE (name);


--
-- Name: employees uk_employees_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT uk_employees_email UNIQUE (email);


--
-- Name: employees uk_employees_phone; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT uk_employees_phone UNIQUE (phone);


--
-- Name: idx_departments_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_name ON public.departments USING btree (name);


--
-- Name: idx_designations_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designations_department_id ON public.designations USING btree (department_id);


--
-- Name: idx_employees_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_department_id ON public.employees USING btree (department_id);


--
-- Name: idx_employees_designation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_designation_id ON public.employees USING btree (designation_id);


--
-- Name: idx_employees_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_org_id ON public.employees USING btree (org_id);


--
-- Name: designations fk_designations_department; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT fk_designations_department FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: employees fk_employees_department; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: employees fk_employees_designation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT fk_employees_designation FOREIGN KEY (designation_id) REFERENCES public.designations(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dx76C5eC2eWStAaZeg9yNy0Bzi9iRwODHli3ckQenvLi6ZVY0j9ONpSFKwuRaY2

