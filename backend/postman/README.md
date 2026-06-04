# BrewOps Postman

## Import

1. **Collection:** `BrewOps-API.postman_collection.json`
2. **Environment:** `BrewOps-Local.postman_environment.json`
3. Select environment **BrewOps Local** in the top-right dropdown.

## Quick start (guest checkout)

1. Start Postgres + app (`dev` profile for payment complete/fail).
2. Open folder **Flows → Happy Path (Guest Checkout)**.
3. Run requests **01** through **09** in order (Collection Runner works well).

Variables `variantId`, `orderId`, and `paymentId` are set automatically by test scripts.

## Staff / kitchen / admin

Kitchen and admin routes need a JWT with `STAFF` or `ADMIN`.

1. **Auth → Register** (creates CUSTOMER) or create a user in DB.
2. Assign role in PostgreSQL, e.g.:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'staff@brewops.local' AND r.name = 'STAFF';
```

3. **Auth → Login** with `staffEmail` / `staffPassword` from the environment.
4. Run **Kitchen** or **Admin - Inventory** requests.

## Payment without Stripe

Use **Payments → Complete Payment (dev)** after **Create Payment** (requires `spring.profiles.active=dev`).

## Stripe webhooks

```bash
stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe
```

Set server env: `STRIPE_ENABLED=true`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`.
