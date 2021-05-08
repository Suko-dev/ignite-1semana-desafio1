const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(item => item.username === username);
  if (!user) {
    return response.status(404).json({ message: "user not found" });
  }
  request.user = user;
  next();
}

function checksExistsTodo(request, response, next) {
  const { id } = request.params;
  const index = request.user.todos.findIndex(item => {
    return item.id === id;
  });
  if (index == -1) {
    return response.status(404).json({ error: 'todo não encontrada' });
  }
  console.log(request.user);
  request.todoIndex = index;
  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const alreadyExists = users.some(item => { return item.username === username; });
  if (alreadyExists) {
    return response.status(400).json({ error: 'usuário já cadastrado' });
  }
  const user = { name, username, id: uuidv4(), todos: [] };
  users.push(user);
  return response.status(201).json(user);

});

app.get('/todos', checksExistsUserAccount, (request, response) => {

  return response.status(200).send(request.user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };
  const { user } = request;
  user.todos.push(todo);
  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { title, deadline } = request.body;
  const { todoIndex, user } = request;

  user.todos[todoIndex].title = title;
  user.todos[todoIndex].deadline = new Date(deadline);
  return response.status(200).json(user.todos[todoIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { todoIndex, user } = request;
  user.todos[todoIndex].done = true;
  return response.status(200).json(user.todos[todoIndex]);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { todoIndex, user } = request;
  user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = app;