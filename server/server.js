require('./config/config');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
	const todo = new Todo({
		text: req.body.text,
		_creator: req.user._id
	});
	todo.save().then((doc) => {
		res.send(doc);
	}).catch((e) => {
		res.status(400).send(e);
	});
});

app.get('/todos', authenticate, (req, res) => {
	Todo.find({
		_creator: req.user._id
	}).then((todos) => {
		res.send({
			todos
		});
	}).catch((e) => {
		res.status(400).send(e);
	});
});

app.get('/todos/:id', authenticate, (req, res) => {
	const todoId = req.params.id;
	if (!ObjectId.isValid(todoId)) {
		return res.status(404).send({
			msg: 'Invalid object id'
		});
	}
	Todo.findOne({
		_id: todoId,
		_creator: req.user._id
	}).then((todo) => {
		if (todo) {
			return res.send({todo});
		}
		return res.status(404).send();
	}).catch((e) => {
		res.status(400).send();
	});
});

app.delete('/todos/:id', authenticate, async (req, res) => {
	try {
		const todoId = req.params.id;
		if(!ObjectId.isValid(todoId)) {
			return res.status(404).send({
				msg: 'Invalid object id'
			});
		}
		const todo = await Todo.findOneAndRemove({
			_id: todoId,
			_creator: req.user._id
		});
		if (todo) {
			return res.send({todo});
		}
		return res.status(404).send();
	} catch (e) {
		res.status(400).send();
	}
});

app.patch('/todos/:id', authenticate, (req, res) => {
	const todoId = req.params.id;
	const body = _.pick(req.body, ['text', 'completed']);

	if(!ObjectId.isValid(todoId)) {
		return res.status(404).send({
			msg: 'Invalid object id'
		});
	}

	if (_.isBoolean(body.completed) && body.completed) {
		body.completedAt = new Date().getTime();
	} else {
		body.completedAt = null;
		body.completed = false;
	}

	Todo.findOneAndUpdate({
		_id: todoId,
		_creator: req.user._id
	}, {
		$set: body
	}, {
		new: true
	}).then((todo) => {
		if (todo) {
			return res.send({todo});
		}
		return res.status(404).send();
	}).catch((e) => {
		res.status(400).send();
	});
});

app.post('/users', async (req, res) => {
	try {
		const body = _.pick(req.body, ['email', 'password']);
		const user = new User(body);
		await user.save();
		const token = await user.generateAuthToken();
		res.header('x-auth', token).send(user);
	} catch (e) {
		res.status(400).send(e);
	}
});

app.get('/users/me', authenticate, (req, res) => {
	res.send(req.user);
});

app.post('/users/login', async (req, res) => {
	try {
		const body = _.pick(req.body, ['email', 'password']);
		const user = await User.findByCredentials(body.email, body.password);
		const token = await user.generateAuthToken();
		res.header('x-auth', token).send(user);
	} catch (e) {
		res.status(400).send();
	}
});

app.delete('/users/me/token', authenticate, async (req, res) => {
	try {
		await req.user.removeToken(req.token);
		res.status(200).send();
	} catch (e) {
		res.status(400).send();
	}
});

app.listen(port, () => {
	console.log(`listening on port ${port}`);
});

module.exports = {
	app
};
