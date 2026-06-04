-- Insert staff user
INSERT INTO users (full_name, email, password_hash, status)
VALUES ('Staff User', 'staff@brewops.local', '$2a$10$z/5vsBZyjUr4u/DljmqFIOWExjahGjycppkPP.TJzIkPU3J6JrBG6', 'ACTIVE');

-- Assign STAFF role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'staff@brewops.local' AND r.name = 'STAFF';

-- Insert admin user
INSERT INTO users (full_name, email, password_hash, status)
VALUES ('Admin User', 'admin@brewops.local', '$2a$10$z/5vsBZyjUr4u/DljmqFIOWExjahGjycppkPP.TJzIkPU3J6JrBG6', 'ACTIVE');

-- Assign ADMIN role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@brewops.local' AND r.name = 'ADMIN';
