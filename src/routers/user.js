const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = new express.Router();

router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

router.post('/users', async (req, res) => {
	const user = new User(req.body);
	try {
		await user.save();
		const token = await user.generateAuthToken();
		res.status(201).send({ user, token });
	} catch (err) {
		console.log(err);
		res.status(400).send(err);
	}
});

const upload = multer({
	limits: {
		fileSize: 1000000 // 1MB
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
			return cb(new Error('Please upload an image file'));
		}
		cb(undefined, true);
	}
});

router.post(
	'/users/me/avatar',
	auth,
	upload.single('avatar'),
	async (req, res) => {
		try {
			const buffer = await sharp(req.file.buffer).png().resize({ width: 250, height: 250 }).toBuffer();
			req.user.avatar = buffer;
			await req.user.save();
			res.status(200).send();
		} catch (err) {
			res.status(500).send(err);
		}
	},
	(error, req, res, next) => {
		// handling errors thrown by multer
		res.status(400).send({ error: error.message });
	}
);

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user || !user.avatar) {
			throw new Error('Unable to find avatar');
		}
		res.set('Content-Type', 'image/png');
		res.status(200).send(user.avatar);
	} catch (err) {
		res.status(404).send(err);
	}
});

router.delete('/users/me/avatar', auth, async (req, res) => {
	try {
		req.user.avatar = undefined;
		await req.user.save();
		res.status(200).send();
	} catch (err) {
		res.status(500).send(err);
	}
});

router.post('/users/login', async (req, res) => {
	try {
		const user = await User.findByCredentials(req.body.email, req.body.password);
		const token = await user.generateAuthToken();
		res.send({ user, token });
	} catch (err) {
		res.status(400).send();
	}
});

router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
		await req.user.save();
		res.send();
	} catch (err) {
		res.status(400).send();
	}
});

router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (err) {
		res.status(400).send();
	}
});

router.patch('/users/me', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password', 'age'];
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid update' });
	}

	try {
		const user = await req.user;
		updates.forEach((update) => (user[update] = req.body[update]));
		await user.save();
		res.status(200).send(user);
	} catch (err) {
		res.status(500).send(err);
	}
});

router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.remove();
		res.status(200).send(req.user);
	} catch (err) {
		res.status(500).send(err);
	}
});

module.exports = router;
