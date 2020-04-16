const request = require('supertest');

const app = require('../src/app');
const User = require('../src/models/user');
const { userOne, userTwo, taskOne, setupDatabase } = require('./fixtures/db');


// clean the database before each test
beforeEach(setupDatabase);

test('Should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Ola',
        email: 'olaola@example.com',
        password: 'Mywordhsg23'
    }).expect(201);

    // assert that user was added to the db
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // assert the correct response
    expect(response.body).toMatchObject({ 
        user: {
            name: 'Ola',
            email: 'olaola@example.com'
        },
        token: user.tokens[0].token
    })

    // assert that password is not stored in plaintext in db
    expect(user.password).not.toBe('Mywordhsg23');
});

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    // assert that new token was added to the db
    const user = await User.findById(response.body.user._id);
    expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login non-existing user', async () => {
    await request(app).post('/users/login').send({
        email: 'ola@example.com',
        password: 'somepass567'
    }).expect(400);
});

test('Should get profile for user', async () => {
    const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    
    // assert the correct response
    expect(response.body.name).toBe(userOne.name);
    expect(response.body.email).toBe(userOne.email);
});

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
});

test('Should delete user account', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(userOne._id);
    expect(user).toBeNull();
});

test('Should not delete unauthenticated user account', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
});

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);

    const user = await User.findById(userOne._id);
    expect(user.avatar).toEqual(expect.any(Buffer)); // toEqual compare objects properies, toBe ===
});

test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ name: 'Aleksandra' })
        .expect(200);

    const user = await User.findById(userOne._id);
    expect(user.name).toEqual('Aleksandra');
});

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ location: 'San Francisco' })
        .expect(400);

    const user = await User.findById(userOne._id);
    expect(user.name).toEqual(userOne.name);
});