# 温酒 Wenjiu

敬请期待

## API 

### Make HTTP Requests

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

### API Responses

Responses are in JSON format and have at least two fields:

- `status`, normally `"success"` or `"failure"`, and
- `message`.

For user login, `userid` and `token` are also sent back.
