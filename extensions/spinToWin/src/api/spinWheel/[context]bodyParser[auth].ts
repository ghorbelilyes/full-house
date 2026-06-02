import { json } from 'express';

const parser = json();

export default function bodyParser(request, response, next) {
  parser(request, response, next);
}
