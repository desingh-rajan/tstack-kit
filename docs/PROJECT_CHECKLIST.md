# Client Project Checklist

Use this checklist when starting a new backend project for a client.

## Project: [Client Name Here]

**Start Date:** [Date] **Developer:** [Your Name] **Estimated Completion:**
[Date]

---

## ☑ Phase 1: Setup (Day 1)

- [ ] Clone TonyStack starter template
- [ ] Initialize git repository
- [ ] Create `.env` file with secure credentials
- [ ] Update `README.md` with project name
- [ ] Install Deno and TonyStack CLI
- [ ] Test that starter runs: `deno task dev`

**Notes:**

```
```

---

## ☑ Phase 2: Planning (Day 1-2)

- [ ] Meet with client to understand requirements
- [ ] Create data model diagram
- [ ] Document entities and relationships
- [ ] List all API endpoints needed
- [ ] Define user roles and permissions
- [ ] Create `docs/requirements.md`
- [ ] Create `docs/api-spec.md`

**Entities Needed:**

```
1. 
2. 
3. 
4.
```

---

## ☑ Phase 3: Development (Day 2-5)

### Entity Generation

- [ ] Generate all entities using `tstack scaffold <entity>`
- [ ] Register routes in `src/main.ts`

### Customization

- [ ] Customize all model schemas with proper fields
- [ ] Add field validations in DTOs
- [ ] Implement business logic in services
- [ ] Add custom endpoints in controllers
- [ ] Set up proper authentication/authorization
- [ ] Add relationships between entities

### Database

- [ ] Generate migrations: `deno task migrate:generate`
- [ ] Review migration files
- [ ] Run migrations: `deno task migrate:run`
- [ ] Seed database with test data

**Progress:**

- Users: [ ]
- Entity 1: [ ]
- Entity 2: [ ]
- Entity 3: [ ]

---

## ☑ Phase 4: Testing (Day 6)

### Unit Tests

- [ ] Write tests for all service methods
- [ ] Test validation logic
- [ ] Test error handling

### Integration Tests

- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test authorization (roles/permissions)
- [ ] Test edge cases

### Manual Testing

- [ ] Test with Postman/Thunder Client
- [ ] Create sample requests collection
- [ ] Test all CRUD operations
- [ ] Test error scenarios

**Test Coverage:** ____%

---

## ☑ Phase 5: Documentation (Day 6-7)

- [ ] Document all API endpoints
- [ ] Add request/response examples
- [ ] Document authentication process
- [ ] Create Postman/OpenAPI collection
- [ ] Write deployment instructions
- [ ] Update README with project-specific info

---

## ☑ Phase 6: Security & Performance (Day 7)

### Security

- [ ] Change default JWT secret to strong random value
- [ ] Set up proper CORS configuration
- [ ] Enable rate limiting
- [ ] Validate all user inputs
- [ ] Sanitize database queries
- [ ] Review and fix any security warnings
- [ ] Test for SQL injection vulnerabilities
- [ ] Set up HTTPS/SSL

### Performance

- [ ] Add database indexes where needed
- [ ] Optimize slow queries
- [ ] Enable caching for frequently accessed data
- [ ] Test API response times
- [ ] Optimize image uploads (if applicable)

---

## ☑ Phase 7: Deployment (Day 7)

### Pre-deployment

- [ ] Set `NODE_ENV=production`
- [ ] Set up production database (PostgreSQL)
- [ ] Configure environment variables
- [ ] Set up backup strategy
- [ ] Configure logging/monitoring

### Deployment

- [ ] Choose deployment platform (Docker/VPS/Deno Deploy)
- [ ] Deploy application
- [ ] Run production migrations
- [ ] Test production deployment
- [ ] Set up SSL certificate
- [ ] Configure domain name

### Post-deployment

- [ ] Set up monitoring/alerts
- [ ] Set up error tracking (Sentry)
- [ ] Create backup schedule
- [ ] Document rollback procedure
- [ ] Perform load testing

---

## ☑ Phase 8: Client Handoff

- [ ] Provide complete API documentation
- [ ] Share Postman collection
- [ ] Provide admin credentials
- [ ] Share deployment access (if applicable)
- [ ] Document maintenance procedures
- [ ] Schedule training session with client
- [ ] Get sign-off from client

---

## Project Metrics

| Metric           | Target | Actual |
| ---------------- | ------ | ------ |
| Total Entities   | ___    | ___    |
| Total Endpoints  | ___    | ___    |
| Test Coverage    | 80%    | ___%   |
| Response Time    | <200ms | ___ms  |
| Development Days | 7      | ___    |

---

## Issues & Notes

**Blockers:**

```
-
```

**Technical Decisions:**

```
-
```

**Client Feedback:**

```
-
```

---

## Final Deliverables

- [ ] Source code repository (GitHub/GitLab)
- [ ] Deployed API (Production URL)
- [ ] API Documentation (Postman/Swagger)
- [ ] Admin Dashboard Access
- [ ] Database Backup
- [ ] Deployment Documentation
- [ ] Maintenance Guide

**Production URL:** https://_______________

**Repository:** https://_______________

**Documentation:** https://_______________

---

## Project Complete

**Completion Date:** [Date] **Total Hours:** [Hours] **Client Satisfaction:**
⭐⭐⭐⭐⭐

---

_Generated with TonyStack - Rails-like DX for Deno Developers_
