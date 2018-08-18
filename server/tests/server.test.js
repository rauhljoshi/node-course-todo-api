const expect = require('expect');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');

const todos = [{
	_id: new ObjectId(),
	text: 'First test todo'
}, {
	_id: new ObjectId(),
	text: 'Second test todo'
}];

//runs before every test case
beforeEach((done) => {
	Todo.remove({}).then(() => {
		return Todo.insertMany(todos);
	}).then(() => done());
});

describe('POST /todos', () => {
	it('should create a new todo', (done) => {
		const text = 'this is some text';

		request(app)
			.post('/todos')
			.send({
				text
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}

				Todo.find({text}).then((todos) => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch((e) => done(e))
			});
	});

	it('should not create a todo with invalid body data', (done) => {
		request(app)
			.post('/todos')
			.send({
				text: ''
			})
			.expect(400)
			.end((err, res) => {
				if (err) {
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((e) => done(e))
			});
	})
});

describe('GET /todos', () => {
	it('should fetch all todos', (done) => {
		request(app)
			.get('/todos')
			.expect(200)
			.expect((res) => {
				expect(res.body.todos.length).toBe(2)
			})
			.end(done);
	});
});

describe('GET /todos/:id', () => {
	it('should fetch a todo doc with a given id', (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toHexString()}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo._id).toBe(todos[0]._id.toHexString())
				expect(res.body.todo.text).toBe(todos[0].text)
			})
			.end(done);
	});

	it('should return a 404 if todo not found', (done) => {
		request(app)
			.get(`/todos/${(new ObjectId()).toHexString()}`)
			.expect(404)
			.end(done);
	});

	it('should return 404 for non-object ids', (done) => {
		request(app)
			.get('/todos/123')
			.expect(404)
			.end(done);
	});
});

describe('DELETE /todos/:id', () => {
	it('should delete a todo with a given id', (done) => {
		request(app)
			.delete(`/todos/${todos[0]._id.toHexString()}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
				expect(res.body.todo.text).toBe(todos[0].text);
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				Todo.findById(todos[0]._id.toHexString()).then((todo) => {
					expect(todo).toNotExist();
					done();
				}).catch((e) => {
					done(err)
				});
			})
	});

	it('should return 404 if todo is not found', (done) => {
		request(app)
			.delete(`/todos/${(new ObjectId()).toHexString()}`)
			.expect(404)
			.end(done);
	});

	it('should return 404 for non-object ids', (done) => {
		request(app)
			.delete('/todos/123')
			.expect(404)
			.end(done);
	});
});