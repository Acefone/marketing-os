-- Migration 001: Initial schema
-- Applies the base schema. Run after docker compose up if schema wasn't auto-applied.
\i /docker-entrypoint-initdb.d/01_schema.sql
