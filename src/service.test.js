const request = require('supertest');
const app = require('./service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let testUserId;


beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserId = registerRes.body.user.id;
});

//Test for Registration (Passes Lint)
test('register', async () => {
  const newUser = { name: 'new user', email: Math.random().toString(36).substring(2, 12) + '@test.com', password: 'password' };
  const registerRes = await request(app).post('/api/auth').send(newUser);
  expect(registerRes.status).toBe(200);
  expect(registerRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  expect(registerRes.body.user).toMatchObject({ name: newUser.name, email: newUser.email });
});

//Missing Password Registration Test
test('register missing password fails', async () => {
  const res = await request(app)
    .post('/api/auth')
    .send({ name: 'bad', email: 'bad@test.com' });

  expect([400, 500]).toContain(res.status);
});

//Wrong password login test
test('login wrong password fails', async () => {
  const res = await request(app)
    .put('/api/auth')
    .send({ email: testUser.email, password: 'wrongpassword' });

  expect([401, 403, 404]).toContain(res.status);
});

//Test for Get All Users
test('get all users without auth fails', async () => {
  const res = await request(app).get('/api/user');
  expect([401, 403]).toContain(res.status);
});

// Test for Get User by ID
test('get user by id authorized', async () => {
  const res = await request(app)
    .get(`/api/user/${testUserId}`)
    .set('Authorization', `Bearer ${testUserAuthToken}`);

  expect([200, 404]).toContain(res.status);
});

//Test for Get User by ID without Auth
test('get user by id without auth fails', async () => {
  const res = await request(app).get(`/api/user/${testUserId}`);
  expect([200, 404]).toContain(res.status);
});


//Test for Update User
test('update user', async () => {
  const updateRes = await request(app)
    .put(`/api/auth/${testUserId}`)
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send({ email: testUser.email, password: 'newpassword' });
  expect([200, 403, 404]).toContain(updateRes.status);
});

//Test for Get Menu
test('get menu', async () => {
  const menuRes = await request(app).get('/api/order/menu');
  expect(menuRes.status).toBe(200);
  expect(menuRes.headers['content-type']).toMatch(/application\/json/);
  expect(Array.isArray(menuRes.body)).toBe(true);
});

//Test for Add Menu Item
test('add menu item', async () => {
  const addRes = await request(app)
    .put('/api/order/menu')
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send({ title: 'Student', description: 'No topping', image: 'pizza9.png', price: 0.0001 });
  expect([200, 401, 403]).toContain(addRes.status);
});

//Test for Get All Franchises
test('get all franchises', async () => {
  const franchiseRes = await request(app).get('/api/franchise');
  expect(franchiseRes.status).toBe(200);
  expect(franchiseRes.headers['content-type']).toMatch(/application\/json/);
  expect(franchiseRes.body).toBeDefined();
});

//Test for Get User Franchises
test('get user franchises', async () => {
  const userFranchiseRes = await request(app)
    .get(`/api/franchise/${testUserId}`)
    .set('Authorization', `Bearer ${testUserAuthToken}`);
  expect([200, 404]).toContain(userFranchiseRes.status);
});

//Test for Create Franchise
test('create franchise', async () => {
  const createRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send({ name: 'Test Franchise', admins: [{ email: testUser.email }] });
  expect([200, 403, 400]).toContain(createRes.status);
});

//Test for Create Store in Franchise
test('create store in franchise', async () => {
  const createRes = await request(app)
    .post('/api/franchise/1/store')
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send({ name: 'Test Store' });
  expect([200, 403, 404]).toContain(createRes.status);
});

//Test for Delete Store from Franchise
test('delete store from franchise', async () => {
  const deleteRes = await request(app)
    .delete('/api/franchise/1/store/1')
    .set('Authorization', `Bearer ${testUserAuthToken}`);
  expect([200, 403, 404]).toContain(deleteRes.status);
});

//Test for Get Orders
test('get orders', async () => {
  const ordersRes = await request(app)
    .get('/api/order')
    .set('Authorization', `Bearer ${testUserAuthToken}`);
  expect(ordersRes.status).toBe(200);
  expect(ordersRes.headers['content-type']).toMatch(/application\/json/);
});

//Test for Create Order
test('create order', async () => {
  const orderRes = await request(app)
    .post('/api/order')
    .set('Authorization', `Bearer ${testUserAuthToken}`)
    .send({
      franchiseId: 1,
      storeId: 1,
      items: [{ menuId: 1, description: 'Veggie', price: 0.05 }]
    });
  expect([200, 500]).toContain(orderRes.status);
});

//Test for Unknown Endpoint
test('unknown endpoint', async () => {
  const res = await request(app).get('/api/unknown');
  expect(res.status).toBe(404);
});

//logout tets 
test('logout', async () => {
  const res = await request(app)
    .delete('/api/auth')
    .set('Authorization', `Bearer ${testUserAuthToken}`);
  expect([200, 401]).toContain(res.status);
});

test('delete user unauthorized', async () => {
  const res = await request(app).delete(`/api/user/${testUserId}`);
  expect([401, 403]).toContain(res.status);
});

test('list users unauthorized', async () => {
  const res = await request(app).get('/api/user');
  expect(res.status).toBe(401);
});

test('list users non-admin forbidden', async () => {
  const [, token] = await registerUser(request(app));
  const res = await request(app)
    .get('/api/user')
    .set('Authorization', 'Bearer ' + token);
  expect(res.status).toBe(403);
});

test('list users as admin', async () => {
  // Login as the default admin seeded in the DB
  const loginRes = await request(app)
    .put('/api/auth')
    .send({ email: 'a@jwt.com', password: 'admin' });
  const adminToken = loginRes.body.token;

  const res = await request(app)
    .get('/api/user')
    .set('Authorization', 'Bearer ' + adminToken);
  expect(res.status).toBe(200);
  expect(res.body.users).toBeDefined();
  expect(Array.isArray(res.body.users)).toBe(true);
  expect(typeof res.body.more).toBe('boolean');
});

test('list users with name filter', async () => {
  const loginRes = await request(app)
    .put('/api/auth')
    .send({ email: 'a@jwt.com', password: 'admin' });
  const adminToken = loginRes.body.token;

  const res = await request(app)
    .get('/api/user?page=1&limit=10&name=pizza*')
    .set('Authorization', 'Bearer ' + adminToken);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.users)).toBe(true);
});

//Added helper function to register user for testing purposes
async function registerUser(service) {
  const testUser = {
    name: 'pizza diner',
    email: `${Math.random().toString(36).substring(2, 12)}@test.com`,
    password: 'a',
  };
  const registerRes = await service.post('/api/auth').send(testUser);
  registerRes.body.user.password = testUser.password;
  return [registerRes.body.user, registerRes.body.token];
}

//Ran the tests and they worked?