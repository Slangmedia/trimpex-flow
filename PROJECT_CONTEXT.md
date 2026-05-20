# 3dflow Project Context

## Project Overview
3dflow is a modern web application built with Next.js, designed for administrative management, project tracking, and AR (Augmented Reality) visualization for ceramic tiles. The platform serves as a centralized hub for managing clients, employees, projects, and approval workflows.

## Technology Stack
- **Framework**: Next.js 14.2.35 (App Router)
- **Language**: TypeScript
- **Database**: Prisma (PostgreSQL likely, given the schema structure)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui, Lucide React, Base UI
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (@tanstack/react-query)
- **Form/Logic**: bcryptjs (for security), date-fns (for dates)

## Directory Structure
- `src/app/`: Core application logic using Next.js App Router.
  - `admin/`: Administrative dashboard and management features (Clients, Employees, Projects, Approvals).
  - `employee/`: Employee-specific views and tasks.
  - `api/`: Backend API routes for data operations.
  - `login/`: Authentication portal.
  - `c/`: Client-facing or shared consumer components.
- `src/components/`: Reusable React components.
- `src/lib/`: Utility functions, Prisma client, and shared libraries.
- `src/types/`: TypeScript definitions and interfaces.
- `prisma/`: Database schema and migrations.

## Recent Activity & Status
- **Database Migration**: Successfully migrated from PostgreSQL to MySQL to match the remote server (`96.127.186.146`).
- **Bug Fixes**: Resolved Next.js startup issues related to SWC binary corruption on macOS.
- **UI Modernization**: Ongoing efforts to migrate admin interfaces to a modern, card-based layout.

## Database Schema (MySQL)
The project uses Prisma to manage a MySQL database with the following core models:

### 1. User (`User`)
- **Purpose**: Platform users (Admins and Employees).
- **Fields**: `id`, `name`, `email`, `password_hash`, `role` (ADMIN/EMPLOYEE), `avatar_url`, `createdAt`.
- **Relationships**:
  - Owns created `Client`s and `Project`s.
  - Assigned to projects via `ProjectEmployee`.
  - Submits `RenderVersion`s.

### 2. Client (`Client`)
- **Purpose**: The companies ordering the renders.
- **Fields**: `id`, `name`, `contact_person`, `email`, `phone`, `logo_url`, `public_link_token`, `pin_enabled`, `is_active`.
- **Relationships**:
  - Belongs to an Admin (`User`).
  - Has many `Project`s.

### 3. Project (`Project`)
- **Purpose**: A specific rendering campaign or order.
- **Fields**: `id`, `name`, `description`, `total_render_count`, `deadline`, `is_active`.
- **Relationships**:
  - Linked to a `Client`.
  - Created by an Admin.
  - Contains multiple `RenderItem`s.
  - Assigned to multiple `User`s (Employees).

### 4. Render Item (`RenderItem`)
- **Purpose**: A specific SKU or product to be rendered.
- **Fields**: `id`, `name`, `sku_code`, `current_version`, `current_status` (SUBMITTED, CLIENT_PENDING, COMPLETE, etc.).
- **Relationships**:
  - Belongs to a `Project`.
  - Tracks multiple `RenderVersion`s.

### 5. Render Version (`RenderVersion`)
- **Purpose**: Iterations of a specific render item.
- **Fields**: `id`, `version_number`, `file_url`, `file_type` (IMAGE/VIDEO), `admin_action`, `client_action`, `is_current_version`.
- **Relationships**:
  - Belongs to a `RenderItem`.
  - Submitted by an Employee (`User`).

### 6. Notification (`Notification`)
- **Purpose**: System alerts for project assignments, submissions, and approvals.
- **Fields**: `id`, `type`, `message`, `is_read`, `related_render_id`, `related_project_id`.

## Key Workflows & Logic
- **Project Assignment**: Admins create projects and assign employees. Notifications are triggered automatically.
- **Render Submission**: Employees upload images/videos for a RenderItem, creating a new RenderVersion.
- **Multi-Level Approval**: 
  1. Admin reviews and approves/rejects.
  2. Client reviews via a public link (protected by token/PIN).
- **Public Client View**: Clients can access their specific projects using a `public_link_token` without requiring a full account login.

## Setup & Development
- **Start Dev Server**: `npm run dev` (Runs on http://localhost:3000 or 3001)
- **Database URL**: Configured in `.env` (Currently pointing to a remote MySQL DB at `96.127.186.146`)
- **Schema Management**:
  - Sync local schema to DB: `npx prisma db push`
  - Introspect DB to local schema: `npx prisma db pull`
  - Generate Client: `npx prisma generate`
