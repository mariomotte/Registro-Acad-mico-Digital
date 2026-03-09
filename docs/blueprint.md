# **App Name**: EduTrack Central

## Core Features:

- User Authentication & Roles: Secure login via email/password. Assign roles (Director, Teacher, Assistant, Admin) to control access to functionalities and data based on user type, leveraging Firebase Authentication.
- Student Profiles: Allow authorized users to register and view student profiles with essential details like name, grade, section, and status, stored in Cloud Firestore.
- Incident Reporting: Teachers and assistants can record new incidents for students, including type (e.g., absenteeism, behavior), description, severity, date, and reporting user. This data is saved to Cloud Firestore.
- Evidence Upload & Management: Enable attaching photos or files as evidence to incidents, utilizing Firebase Storage for media management.
- Director Dashboard: A centralized dashboard for directors to quickly view recent incidents and search for student-specific reports, displaying key information from Cloud Firestore.
- Automated Anomaly Alerts: Automatically generate alerts for directors when a student accumulates a predefined number of incidents within a short period, implemented via Cloud Functions.
- AI-Powered Incident Summarizer: Utilize a Cloud Function tool to analyze an accumulation of incidents for a student, generating a concise summary of the case and suggesting potential next actions for educators.

## Style Guidelines:

- Primary color: A deep, professional blue-grey (#1F4FAD) for trust and reliability in an educational context.
- Background color: A very light, almost off-white blue-grey (#F0F1F5) for a clean, spacious, and calming user experience.
- Accent color: A vibrant cyan-blue (#1AC5E6) to draw attention to critical information like alerts or call-to-action buttons, adding a touch of modernity.
- Body and headline font: 'Inter' (sans-serif) for its modern, clear, and highly readable qualities across various screen sizes and text densities.
- Employ a consistent set of clean, outlined icons that are intuitive and educational, avoiding overly complex or decorative elements to maintain clarity.
- Implement a dashboard-centric layout with informative cards for key metrics, well-structured tables for student and incident data, and an adaptable left-hand navigation panel. The layout must be responsive, ensuring optimal viewing and interaction on both mobile devices and desktops.
- Incorporate subtle, quick animations for state changes, form submissions, and data loading indicators to provide immediate feedback and enhance the perceived responsiveness of the application.