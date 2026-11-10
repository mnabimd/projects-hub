# Implementation Plan: Hierarchical User Provisioning & Closed Registration

This plan outlines the changes needed to transition ProjectsHub to a closed, hierarchically delegated account provisioning model.

---

## 1. Objectives & Overview
1. **Disable Public Registration:** Disable or remove `/v1/auth/register` so no public self-registration is possible for any role.
2. **Introduce New Roles:**
   - `admin`: Basic/institutional administrator responsible for managing universities and provisioning faculty deans.
   - `department_head`: Head of a department authorized to provision teachers and enroll students within their assigned faculty/department.
3. **Establish Delegated Provisioning Hierarchy:**
   - `super_admin` ➔ Provisions `admin`
   - `admin` ➔ Provisions `faculty_dean` (scoped to creator's `universityId`)
   - `faculty_dean` ➔ Provisions `department_head`, `teacher`, `student` (scoped to creator's `universityId` and `facultyId`)
   - `department_head` ➔ Provisions `teacher`, `student` (scoped to creator's `universityId`, `facultyId`, and `departmentId`)
4. **Prevent Horizontal & Vertical Privilege Escalation:** Validate that requesters can only provision allowed descendant roles and cannot assign entities outside their authorized academic scope.

---

## 2. Proposed Changes by Architectural Layer

### A. Roles & Permissions (`apps/api/src/config/roles.js`)
* Update `allRoles` to add:
  * `admin`:
    * Permissions: `getUsers`, `manageUsers`, `getUniversities`, `manageUniversities`, `getTags`, `manageTags`, `getNotifications`
  * `department_head`:
    * Permissions: `getUsers`, `manageUsers`, `getTags`, `getUniversities`, `reviewProject`, `getNotifications`
* Update existing role permissions if required:
  * Restrict `manageUniversities` from `faculty_dean` if university management is delegated to `admin` / `super_admin`.
* Define the provisioning authority hierarchy matrix:
  ```javascript
  const roleHierarchy = {
    super_admin: ['admin', 'faculty_dean', 'department_head', 'teacher', 'student'],
    admin: ['faculty_dean', 'department_head', 'teacher', 'student'],
    faculty_dean: ['department_head', 'teacher', 'student'],
    department_head: ['teacher', 'student'],
    teacher: [],
    student: [],
  };
  ```

### B. User Model (`apps/api/src/models/user.model.js`)
* Update the Mongoose schema `role` enum to include `admin` and `department_head`.
* Ensure indexing and relationship validation:
  * Compound index for students: `{ kankorId: 1, institutionId: 1 }` or `{ kankorId: 1, universityId: 1 }`.
  * Ensure `universityId`, `facultyId`, and `departmentId` references align with the new role boundaries.

### C. Authentication Routes (`apps/api/src/routes/v1/auth.route.js`)
* Remove or disable `POST /v1/auth/register`.
* If a request is received on `/register`, return `403 Forbidden` or `404 Not Found` with a message that self-registration is disabled.
* Update Swagger documentation to remove `/auth/register` from public interactive documentation.

### D. Validation Schemas (`apps/api/src/validations/user.validation.js`)
* Update `createUser`:
  * `role`: Must be one of `['admin', 'faculty_dean', 'department_head', 'teacher', 'student']` (`super_admin` cannot be provisioned via standard user endpoint).
  * Require `fullName`, `email`, `password`, `role`.
  * Optional / conditional fields depending on role:
    * `universityId` (required for `admin`, `faculty_dean`, `department_head`, `teacher`, `student`)
    * `facultyId` (required for `faculty_dean`, `department_head`, `teacher`, `student`)
    * `departmentId` (required for `department_head`, `student`, and departmental `teacher`)
    * `kankorId` (required if role is `student`)

### E. User Service (`apps/api/src/services/user.service.js`)
* Modify `createUser(creatorUser, userBody)`:
  * Check hierarchy: verify `roleHierarchy[creatorUser.role].includes(userBody.role)`. If not allowed, throw `ApiError(httpStatus.FORBIDDEN, 'Insufficient privileges to create this role')`.
  * Enforce scoping inheritance:
    * If `creatorUser.role === 'admin'`: Override or strictly enforce `userBody.universityId = creatorUser.universityId`. Reject any attempts to target other universities.
    * If `creatorUser.role === 'faculty_dean'`: Enforce `userBody.universityId = creatorUser.universityId` and `userBody.facultyId = creatorUser.facultyId`.
    * If `creatorUser.role === 'department_head'`: Enforce `universityId`, `facultyId`, and `departmentId` to match the department head's scope.
  * Verify duplicate email via `User.isEmailTaken`.
  * Hash password and set initial security state (`mustChangePassword: true`).

### F. User Controller (`apps/api/src/controllers/user.controller.js`)
* In `createUser`, pass `req.user` alongside `req.body` into `userService.createUser(req.user, req.body)`.
* Return `201 Created` with sanitized public user representation.

### G. Routes & OpenAPI / Swagger (`apps/api/src/routes/v1/user.route.js`)
* `POST /v1/users` remains guarded by `auth('manageUsers')`.
* Document updated payload structure, role requirements, and error responses (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`).

---

## 3. Testing & Verification Strategy

### Automated Integration Tests
1. **`tests/integration/auth.test.js`**:
   - Verify public `/v1/auth/register` is blocked/disabled.
2. **`tests/integration/user.test.js`**:
   - **Super Admin:** Can create `admin`, `faculty_dean`, `department_head`, `teacher`, `student`.
   - **Admin:**
     - Can create `faculty_dean` in their assigned university.
     - Blocked with `403` when trying to create another `admin` or `super_admin`.
     - Blocked with `403` when trying to assign a user to a different university.
   - **Faculty Dean:**
     - Can create `department_head`, `teacher`, and `student` in their faculty.
     - Blocked with `403` when trying to create `faculty_dean`, `admin`, or `super_admin`.
     - Blocked with `403` when trying to assign to another faculty or university.
   - **Department Head:**
     - Can create `teacher` and `student` in their assigned department/faculty.
     - Blocked with `403` when trying to create any administrative role.
   - **Teacher & Student:**
     - Blocked with `403` on `POST /v1/users`.

### Manual & Linter Checks
```bash
cd apps/api
npm run lint
npm test tests/integration/user.test.js
npm test tests/integration/auth.test.js
```
