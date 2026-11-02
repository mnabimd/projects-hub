# .github

This directory contains GitHub Actions workflows and configuration for ProjectsHub.

## Workflows

| Workflow | Path | Trigger Paths | Description |
| :--- | :--- | :--- | :--- |
| **API: CI** | [.github/workflows/api-ci.yml](file:///Users/apple/Desktop/Projects/Personal/projects-hub/.github/workflows/api-ci.yml) | `apps/api/**`, `packages/**` | Prettier, ESLint, Jest suite with MongoDB 5.0 container, Docker build verification |
| **Web: CI** | `.github/workflows/web-ci.yml` *(future)* | `apps/web/**`, `packages/**` | Frontend build, lint, and unit tests |
| **Mobile: CI** | `.github/workflows/mobile-ci.yml` *(future)* | `apps/mobile/**`, `packages/**` | React Native / Flutter build & test suite |

