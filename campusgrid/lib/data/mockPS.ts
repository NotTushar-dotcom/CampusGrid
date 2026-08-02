import { ProblemStatement } from '@/types';

// =============================================================
// Mock Problem Statements
// Used as fallback when Supabase is not configured
// Same data as supabase/seed.sql → events.ps_links
// =============================================================

export const MOCK_PROBLEM_STATEMENTS: ProblemStatement[] = [
  {
    id: 'SIH2026-SW-001',
    title: 'AI-Powered Grievance Redressal System for Government Departments',
    category: 'Software',
    organization: 'Ministry of Personnel, Public Grievances and Pensions',
    description:
      'Design an intelligent grievance management system that uses NLP and machine learning to auto-categorize, prioritize, and route citizen complaints to appropriate departments, with real-time tracking and sentiment analysis.',
    official_url: 'https://www.sih.gov.in/sih2026PS',
    tags: ['AI/ML', 'NLP', 'Government', 'React', 'Python'],
  },
  {
    id: 'SIH2026-SW-002',
    title: 'Blockchain-Based Land Records Management System',
    category: 'Software',
    organization: 'Ministry of Rural Development',
    description:
      'Develop a tamper-proof, decentralized land registry system using blockchain technology to prevent fraudulent land transactions, enable transparent ownership tracking, and facilitate digital mutation processes.',
    official_url: 'https://www.sih.gov.in/sih2026PS',
    tags: ['Blockchain', 'Web3', 'Node.js', 'Security'],
  },
  {
    id: 'SIH2026-SW-003',
    title: 'Smart Traffic Management with Computer Vision & Edge AI',
    category: 'Software',
    organization: 'Ministry of Road Transport and Highways',
    description:
      'Build a real-time adaptive traffic signal control system using CCTV feeds, computer vision, and edge AI to reduce congestion at intersections. Include emergency vehicle priority routing and accident detection.',
    official_url: 'https://www.sih.gov.in/sih2026PS',
    tags: ['Computer Vision', 'Edge AI', 'OpenCV', 'IoT', 'Python'],
  },
  {
    id: 'SIH2026-SW-004',
    title: 'Multilingual Digital Literacy Platform for Rural India',
    category: 'Software',
    organization: 'Ministry of Electronics and Information Technology',
    description:
      'Create an offline-capable, voice-first digital literacy application supporting 22 Indian languages. Target rural populations with no prior smartphone experience using progressive skill modules and gamification.',
    official_url: 'https://www.sih.gov.in/sih2026PS',
    tags: ['Flutter', 'Offline-First', 'NLP', 'React Native', 'UX'],
  },
  {
    id: 'SIH2026-HW-001',
    title: 'Low-Cost Portable Water Quality Testing Device',
    category: 'Hardware',
    organization: 'Ministry of Jal Shakti',
    description:
      'Design a solar-powered, IoT-enabled water quality sensor unit that measures TDS, pH, turbidity, and bacterial contamination. Device must cost under ₹2000 and transmit data to a central dashboard via LoRaWAN.',
    official_url: 'https://www.sih.gov.in/sih2026PS',
    tags: ['IoT', 'Arduino', 'Sensors', 'LoRaWAN', 'Embedded C'],
  },
  {
    id: 'SIH2026-HW-002',
    title: 'Smart Helmet with Collision Detection and SOS Alert for Miners',
    category: 'Hardware',
    organization: 'Ministry of Coal',
    description:
      'Develop a ruggedized smart helmet for underground coal miners with gas sensors (CO, CH4), proximity collision detection, real-time location tracking via UWB, and automatic SOS alert on fall detection.',
    official_url: 'https://www.sih.gov.in/sih2026PS',
    tags: ['Embedded Systems', 'UWB', 'Gas Sensors', 'ESP32', 'Safety'],
  },
  {
    id: 'SIH2026-HW-003',
    title: 'Autonomous Drone for Agricultural Crop Health Monitoring',
    category: 'Hardware',
    organization: 'Ministry of Agriculture & Farmers Welfare',
    description:
      'Build an affordable autonomous drone with multispectral imaging to detect crop diseases, pest infestations, and water stress in real-time. Provide farmers with actionable AI-generated reports via a companion mobile app.',
    official_url: 'https://www.sih.gov.in/sih2026PS',
    tags: ['Drone', 'Multispectral', 'AI/ML', 'Computer Vision', 'ROS'],
  },
  {
    id: 'SIH2026-HW-004',
    title: 'Wearable Posture Correction and Ergonomics Monitor',
    category: 'Hardware',
    organization: 'Ministry of Health and Family Welfare',
    description:
      'Create a non-intrusive wearable band using flex sensors and IMU to monitor spinal posture throughout the workday. Vibrate for real-time correction, sync data to a health app, and generate ergonomics risk reports.',
    official_url: 'https://www.sih.gov.in/sih2026PS',
    tags: ['Wearable', 'IMU', 'BLE', 'Health', 'React Native'],
  },
];

export const MOCK_EVENT = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  title: 'SIH 2026 Internal Mini-Hackathon',
  slug: 'sih-2026-internal',
  description:
    'GL Bajaj Institute internal selection round for Smart India Hackathon 2026.',
  start_date: '2026-08-15T09:00:00+05:30',
  end_date: '2026-09-10T18:00:00+05:30',
  is_active: true,
  ps_links: MOCK_PROBLEM_STATEMENTS,
  created_at: new Date().toISOString(),
};
