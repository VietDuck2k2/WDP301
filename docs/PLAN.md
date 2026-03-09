# Plan: Comprehensive API-UI Feature Audit & Gap Analysis

As requested, I will conduct a thorough audit of the project to ensure that all Backend (BE) APIs and Frontend (FE) UI features are consistent and complete. This audit will identify any missing links or unused parts between the two layers.

## Methodology

### 1. Data Collection
We will use three specialized agents to collect and verify information:
- **Explorer Agent**: Map the physical structure of routes, controllers, and services.
- **Backend Specialist**: Deep-dive into BE logic to list all available endpoints, required payloads, and permissions.
- **Frontend Specialist**: Deep-dive into FE components to list all UI features, their data requirements, and which APIs they consume.

### 2. Analysis & Comparison
- **BE vs FE-API**: Verify that all endpoints defined in the BE routes/controllers have corresponding methods in the FE `api/` services.
- **FE-API vs FE-UI**: Verify that all FE UI pages and components actually use the available FE `api/` services.
- **Feature Completeness**: Look for "orphaned" features (UI with no logic) or "dead" endpoints (API with no entry point).

### 3. Reporting
I will generate a final **Gap Analysis Report** including:
- ✅ **Synchronized Features**: Features fully implemented on both sides.
- ⚠️ **Missing Backend Support**: UI features that need new API endpoints.
- ⚠️ **Underutilized APIs**: Backend endpoints that are ready but not yet integrated into the UI.
- ❌ **Broken Links**: Dead API calls or missing service functions.

## Proposed Audit Areas
| Module | Focus |
|--------|-------|
| **Admin** | Users, Classes, Schedules, Reports, Dashboard |
| **Teacher** | Assignments, Attendance, Sessions, Announcements |
| **Student** | Grades, Submissions, Timetable, Announcements |
| **Common** | Authentication, Profile, Notifications, File Uploads |

## Verification Plan
### Automated Verification
- Run `lint_runner.py` to check for unused imports or variables in FE/BE.
- Run `security_scan.py` to check for unprotected endpoints.

---
**Onaylıyor musunuz? (Y/N)**
- Y: Implementation başlatılır
- N: Planı düzeltirim
