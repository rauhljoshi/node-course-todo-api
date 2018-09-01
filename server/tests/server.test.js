const expect = require('expect');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

//runs before every test case
beforeEach(populateUsers);
beforeEach(populateTodos);

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
			});
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

describe('PATCH /todos/:id', () => {
	it('should update the todo', (done) => {
		const todoId = todos[0]._id.toHexString();
		const text = 'Some new shit';
		const completed = true;
		request(app)
			.patch(`/todos/${todoId}`)
			.send({
				text,
				completed
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(text);
				expect(res.body.todo.completed).toBe(true);
				expect(res.body.todo.completedAt).toBeA('number');
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				Todo.findById(todoId).then((todo) => {
					expect(todo.text).toBe(text);
					expect(todo.completed).toBe(true);
					expect(todo.completedAt).toBeA('number');
					done();
				}).catch((e) => {
					done(err)
				});
			});

	});

	it('should clear completedAt when todo is not completed', (done) => {
		const todoId = todos[1]._id.toHexString();
		const completed = false;
		request(app)
			.patch(`/todos/${todoId}`)
			.send({
				completed
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.completed).toBe(false);
				expect(res.body.todo.completedAt).toNotExist();
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
				Todo.findById(todoId).then((todo) => {
					expect(todo.completed).toBe(false);
					expect(todo.completedAt).toNotExist();
					done();
				}).catch((e) => {
					done(err)
				});
			});
	});
});

describe('GET /users/me', () => {
	it('should return user if authenticated', (done) => {
		request(app)
			.get('/users/me')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body._id).toBe(users[0]._id.toHexString());
				expect(res.body.email).toBe(users[0].email);
			})
			.end(done);
	});

	it('should return 401 if not authenticated', (done) => {
		request(app)
			.get('/users/me')
			.expect(401)
			.expect((res) => {
				expect(res.body).toEqual({})
			})
			.end(done)
	});
});

describe('POST /users', () => {
	it('should create a user', (done) => {
		const email = 'example@example.com';
		const password = 'abc123!';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toExist();
				expect(res.body._id).toExist();
				expect(res.body.email).toBe(email);
			})
			.end(done);
	});

	it('should return validation errors if request is invalid', (done) => {
		const email = 'exampcom';
		const password = '';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(400)
			.end(done);
	});

	it('should not create a user if email in use', (done) => {
		const email = 'rahul@gmail.com';
		const password = 'dasdas123123';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(400)
			.end(done);
	});
})