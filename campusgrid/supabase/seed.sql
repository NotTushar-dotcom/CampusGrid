-- =============================================================
-- CampusGrid Seed Data
-- Apply AFTER schema.sql
-- =============================================================

-- =============================================================
-- ADMIN SPOC PRE-PROVISIONING
-- Run this block with Supabase service-role (SQL Editor).
-- The SPOC can log in immediately; change the password after
-- first login via Supabase Dashboard → Authentication → Users.
-- =============================================================
DO $$
DECLARE
  v_admin_id UUID := gen_random_uuid();
BEGIN
  -- 1. Insert into Supabase auth (only if not already present)
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'spoc@glbajajgroup.org'
  ) THEN
    INSERT INTO auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      recovery_sent_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, instance_id
    ) VALUES (
      v_admin_id,
      'authenticated',
      'authenticated',
      'spoc@glbajajgroup.org',
      crypt('Admin@GLBAJAJ2026', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::JSONB,
      '{"full_name":"College SPOC Admin"}'::JSONB,
      NOW(), NOW(),
      '00000000-0000-0000-0000-000000000000'
    );

    -- 2. The trigger handle_new_user will auto-insert into public.users
    --    with role='student'; override it to admin_spoc
    UPDATE public.users
    SET role = 'admin_spoc', full_name = 'College SPOC Admin'
    WHERE email = 'spoc@glbajajgroup.org';
  END IF;
END $$;


-- Insert the SIH 2026 Internal Mini-Hackathon event
-- with 8 sample Problem Statements in ps_links JSONB
INSERT INTO public.events (
  id,
  title,
  slug,
  description,
  start_date,
  end_date,
  is_active,
  ps_links
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'SIH 2026 Internal Mini-Hackathon',
  'sih-2026-internal',
  'GL Bajaj Group of Institutions internal selection round for Smart India Hackathon 2026. Teams of 6 compete on real government problem statements to earn a spot in the national SIH finals.',
  '2026-08-15 09:00:00+05:30',
  '2026-09-10 18:00:00+05:30',
  true,
  '[
    {
      "id": "SIH2026-SW-001",
      "title": "AI-Powered Grievance Redressal System for Government Departments",
      "category": "Software",
      "organization": "Ministry of Personnel, Public Grievances and Pensions",
      "description": "Design an intelligent grievance management system that uses NLP and machine learning to auto-categorize, prioritize, and route citizen complaints to appropriate departments, with real-time tracking and sentiment analysis.",
      "official_url": "https://www.sih.gov.in/sih2026PS",
      "tags": ["AI/ML", "NLP", "Government", "React", "Python"]
    },
    {
      "id": "SIH2026-SW-002",
      "title": "Blockchain-Based Land Records Management System",
      "category": "Software",
      "organization": "Ministry of Rural Development",
      "description": "Develop a tamper-proof, decentralized land registry system using blockchain technology to prevent fraudulent land transactions, enable transparent ownership tracking, and facilitate digital mutation processes.",
      "official_url": "https://www.sih.gov.in/sih2026PS",
      "tags": ["Blockchain", "Web3", "Node.js", "Security"]
    },
    {
      "id": "SIH2026-SW-003",
      "title": "Smart Traffic Management with Computer Vision & Edge AI",
      "category": "Software",
      "organization": "Ministry of Road Transport and Highways",
      "description": "Build a real-time adaptive traffic signal control system using CCTV feeds, computer vision, and edge AI to reduce congestion at intersections. Include emergency vehicle priority routing and accident detection.",
      "official_url": "https://www.sih.gov.in/sih2026PS",
      "tags": ["Computer Vision", "Edge AI", "OpenCV", "IoT", "Python"]
    },
    {
      "id": "SIH2026-SW-004",
      "title": "Multilingual Digital Literacy Platform for Rural India",
      "category": "Software",
      "organization": "Ministry of Electronics and Information Technology",
      "description": "Create an offline-capable, voice-first digital literacy application supporting 22 Indian languages. Target rural populations with no prior smartphone experience using progressive skill modules and gamification.",
      "official_url": "https://www.sih.gov.in/sih2026PS",
      "tags": ["Flutter", "Offline-First", "NLP", "React Native", "UX"]
    },
    {
      "id": "SIH2026-HW-001",
      "title": "Low-Cost Portable Water Quality Testing Device",
      "category": "Hardware",
      "organization": "Ministry of Jal Shakti",
      "description": "Design a solar-powered, IoT-enabled water quality sensor unit that measures TDS, pH, turbidity, and bacterial contamination. Device must cost under ₹2000 and transmit data to a central dashboard via LoRaWAN.",
      "official_url": "https://www.sih.gov.in/sih2026PS",
      "tags": ["IoT", "Arduino", "Sensors", "LoRaWAN", "Embedded C"]
    },
    {
      "id": "SIH2026-HW-002",
      "title": "Smart Helmet with Collision Detection and SOS Alert for Miners",
      "category": "Hardware",
      "organization": "Ministry of Coal",
      "description": "Develop a ruggedized smart helmet for underground coal miners with gas sensors (CO, CH4), proximity collision detection, real-time location tracking via UWB, and automatic SOS alert on fall detection.",
      "official_url": "https://www.sih.gov.in/sih2026PS",
      "tags": ["Embedded Systems", "UWB", "Gas Sensors", "ESP32", "Safety"]
    },
    {
      "id": "SIH2026-HW-003",
      "title": "Autonomous Drone for Agricultural Crop Health Monitoring",
      "category": "Hardware",
      "organization": "Ministry of Agriculture & Farmers Welfare",
      "description": "Build an affordable autonomous drone with multispectral imaging to detect crop diseases, pest infestations, and water stress in real-time. Provide farmers with actionable AI-generated reports via a companion mobile app.",
      "official_url": "https://www.sih.gov.in/sih2026PS",
      "tags": ["Drone", "Multispectral", "AI/ML", "Computer Vision", "ROS"]
    },
    {
      "id": "SIH2026-HW-004",
      "title": "Wearable Posture Correction and Ergonomics Monitor",
      "category": "Hardware",
      "organization": "Ministry of Health and Family Welfare",
      "description": "Create a non-intrusive wearable band using flex sensors and IMU to monitor spinal posture throughout the workday. Vibrate for real-time correction, sync data to a health app, and generate ergonomics risk reports.",
      "official_url": "https://www.sih.gov.in/sih2026PS",
      "tags": ["Wearable", "IMU", "BLE", "Health", "React Native"]
    }
  ]'::JSONB
)
ON CONFLICT (slug) DO UPDATE SET
  ps_links = EXCLUDED.ps_links,
  is_active = EXCLUDED.is_active;
