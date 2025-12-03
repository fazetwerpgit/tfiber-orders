-- Migration: Add promo code column to orders table
-- Allows salespeople to track promotional codes used on orders

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
