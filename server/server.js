const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
	const todo = new Todo({
		text: req.body.text
	});
	todo.save().then((doc) => {
		res.send(doc);
	}).catch((e) => {
		res.status(400).send(e);
	});
});

app.get('/todos', (req, res) => {
	Todo.find().then((todos) => {
		res.send({
			todos
		});
	}).catch((e) => {
		res.status(400).send(e);
	});
});

app.get('/todos/:id', (req, res) => {
	const todoId = req.params.id;
	if (!ObjectId.isValid(todoId)) {
		return res.status(404).send({
			msg: 'Invalid object id'
		});
	}
	Todo.findById(todoId).then((todo) => {
		if (todo) {
			return res.send({todo});
		}
		return res.status(404).send();
	}).catch((e) => {
		res.status(400).send();
	});
});

app.listen(port, () => {
	console.log(`listening on port ${port}`);
});

module.exports = {
	app
};
