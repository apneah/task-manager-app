const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneId,
    name: 'Mike',
    email: 'mike@example.com',
    password: 'ahsgT12#g',
    tokens: [{
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
    _id: userTwoId,
    name: 'Andrew',
    email: 'andr@example.com',
    password: 'mypass67@3f',
    tokens: [{
        token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET)
    }]
};

const taskOne = {
    _id: mongoose.Types.ObjectId(),
    description: 'Water the plants',
    completed: false,
    owner: userOne._id
};

const setupDatabase = async () => {
    await User.deleteMany();
    await Task.deleteMany();
    await new User(userOne).save();
    await new User(userTwo).save();
    await new Task(taskOne).save();
};

module.exports = {
    userOne,
    userTwo,
    taskOne,
    setupDatabase
};