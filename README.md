# Zenca

**A proximity-aware alert and emergency communication platform concept.**

Zenca explores how device registration, location-aware queries and push notifications can work together to deliver relevant alerts to registered devices.

## Core workflow

1. A client registers a device identifier, push token and location.
2. Device registration data is stored for later targeting.
3. An alert is created by an authorised workflow.
4. A geospatial database query identifies registered devices within the configured radius.
5. The notification service sends push notifications through Firebase Cloud Messaging.

## Architecture

```text
Client application
   │
   ├── Device identifier
   ├── FCM registration token
   └── Location
          │
          ▼
   Supabase backend
          │
          ├── Device registration
          ├── Geospatial lookup
          └── Alert processing
                    │
                    ▼
          Firebase Cloud Messaging
                    │
                    ▼
            Registered devices
```

## Technology areas

- Progressive web application architecture
- Supabase Edge Functions and database RPC
- Geospatial device lookup
- Firebase Cloud Messaging
- Device registration and location data

## Engineering focus

Zenca is an exploration of the relationship between location data, device identity and notification delivery. Important engineering considerations include location freshness, permission boundaries, notification reliability, rate limiting, data minimisation and protecting device tokens.

## Configuration and security

- Keep service credentials outside source control.
- Treat device tokens and location data as sensitive operational data.
- Validate and authorise alert creation on the server.
- Apply appropriate access controls to device registration and alert workflows.
- Review retention and deletion policies for location information.

## Project status

This repository represents an evolving project. Code-level integrations do not by themselves establish production deployment, delivery guarantees, public-sector adoption or measured performance. The effective notification radius should be confirmed from the active configuration before quoting it.

## Author

**Babs Ahmed** · [GitHub](https://github.com/babzin) · [LinkedIn](https://www.linkedin.com/in/babs-ahmed-581b5a270) · [X](https://x.com/Saintbabz)
