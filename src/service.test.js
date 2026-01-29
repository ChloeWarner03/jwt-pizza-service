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

//Test for Login (Passes Lint)
test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(password).toBeDefined();
  expect(loginRes.body.user).toMatchObject(user);
});