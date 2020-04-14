const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

// GET /tasks?completed=true
// GET /tasks?limit=5&skip=3
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    if (req.query.completed) {
        if (req.query.completed === "true") {
            match.completed = true;
        } else {
            match.completed = false;
        }
    }
    const sort = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(":");
        if (parts[1] === "asc") {
            sort[parts[0]] = 1;
        } else if (parts[1] === "desc") {
            sort[parts[0]] = -1;
        }
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.status(200).send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try { 
        await task.save();
        res.status(201).send(task);
    } catch (err) {
        res.status(400).send(err);
    }
});

router.patch('/tasks/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update' });
    }

    try {
        const _id = req.params.id;
        const task = await Task.findOne({ _id, owner: req.user._id });
        
        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();

        if (!task) {
            return res.status(404).send();
        }
        res.status(200).send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.status(200).send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;