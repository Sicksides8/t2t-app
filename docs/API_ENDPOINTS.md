# T2T Academy - API Endpoints

Base URL local: `http://localhost:3000/api`

Protected endpoints require:

```http
Authorization: Bearer {Firebase ID Token}
```

## Public / App

- `GET /api/health`
- `GET /api/courses`
- `GET /api/courses/:id`
- `GET /api/plans`

## Student

- `POST /api/enrollments`
- `POST /api/progress/lesson-complete`
- `GET /api/subscriptions/me`
- `POST /api/subscriptions/redeem`
- `GET /api/notifications`

## Admin

- `GET /api/admin/stats`
- `POST /api/admin/push`
