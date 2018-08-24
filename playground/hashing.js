const { SHA256 } = require('crypto-js');
const jwr = require('jsonwebtoken');

let message = 'Rahul Joshi';
let hashedMessage = SHA256(message).toString();

console.log(hashedMessage);