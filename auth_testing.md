# Auth-Gated App Testing Playbook

## Setup
Create test user + session directly in Mongo:

```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  credits: 24,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Backend API (use Bearer header for tests)
```bash
curl -X GET  "$URL/api/auth/me"        -H "Authorization: Bearer SESSION_TOKEN"
curl -X GET  "$URL/api/bookings"       -H "Authorization: Bearer SESSION_TOKEN"
curl -X POST "$URL/api/bookings"       -H "Authorization: Bearer SESSION_TOKEN" \
     -H "Content-Type: application/json" -d '{"class_id":"<id>"}'
curl -X POST "$URL/api/auth/logout"    -H "Authorization: Bearer SESSION_TOKEN"
```

## Browser Testing — set cookie before nav
```python
await page.context.add_cookies([{
  "name": "session_token", "value": "SESSION_TOKEN",
  "domain": "vitality-mvp.preview.emergentagent.com",
  "path": "/", "httpOnly": True, "secure": True, "sameSite": "None"
}])
await page.goto(URL + "/dashboard")
```

## Cleanup
```bash
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\\.user\\./});
db.user_sessions.deleteMany({session_token: /test_session/});
db.bookings.deleteMany({user_id: /test-user-/});
"
```

## Success indicators
- `/api/auth/me` returns user JSON (200)
- /dashboard and /partner load when authed; redirect to /login when not
- Bookings created by the authed user only show up for that user
