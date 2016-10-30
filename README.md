# 温酒 Wenjiu

敬请期待

## API 

### HTTP Requests

`userid` and `token` are routinely in the headers while others should be sent 
in the body.

- user registration, [POST] @ `/api/users` with 
  - `username` (string with length at most 30),
  - `password`,
  - and other optional fields (to be implemented).

- user login, [POST] @ `/api/sessions` with 
  - `userid` (integer), and
  - `token` (string).

- user logout, [DELETE] @ `/api/sessions` with 
  - `userid` (integer), and
  - `token` (string).

- publish a request, [POST] @ `/api/requests` with 
  - `userid`,
  - `token`,
  - `title`,
  - `text`, and 
  - `end_time`.

- view a request [GET] @ `/api/requests/:request_id` with 
  - `userid`,
  - `token`.

- delete a request [DELETE] @ `/api/requests/:request_id` with 
  - `userid`,
  - `token`, and 
  - `request_id`.

- view recent requests [GET] @ `/api/requests` with 
  - `userid`, and
  - `token`.

### API Responses

Responses are in JSON format and have at least two fields:

- `status`, normally `"success"` or `"failure"`, and
- `message`.

For user login, `userid` and `token` are also sent back.
