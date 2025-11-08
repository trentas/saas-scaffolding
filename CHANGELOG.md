# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 - 2025-11-08

### Added
- Introduced a dedicated `/auth/post-login` resolver to finalize OAuth redirects and honor invite links.
- Documented environment requirements for Google OAuth and added an MIT LICENSE file.

### Improved
- Ensured Google OAuth accounts merge with existing credential-based users for a seamless sign-in experience.
- Set a default `metadataBase` to eliminate Next.js warnings during development and build.


