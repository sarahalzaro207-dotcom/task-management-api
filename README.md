# Task Management API

A REST API for managing tasks, built with Node.js and Express.
Data is stored in a local JSON file (`data/tasks.json`). No database is used.

> Local JSON storage is for learning and low-volume use only.
> Do not run multiple server processes that write to the same file.

## Installation

```bash
git clone <your-repo-url>
cd task-management-api
npm install
```

Create a `.env` file (copy `.env.example`):

```
PORT=3000
NODE_ENV=development
```

## Run

```bash
npm start       # normal start
npm run dev     # development (restarts on file changes)
```

The server runs on `http://localhost:3000`.
The file `data/tasks.json` is created automatically if it does not exist.
## Task fields

| Field | Type | Required | Rules |
|---|---|---|---|
| `id` | string | generated | Unique id created by the server |
| `title` | string | yes | Trimmed, 1 to 120 characters |
| `description` | string | no | Up to 1000 characters |
| `status` | string | no | `pending`, `in-progress`, `completed` (default `pending`) |
| `priority` | string | no | `low`, `medium`, `high` (default `medium`) |
| `dueDate` | string | no | Valid date in `YYYY-MM-DD` format |
| `createdAt` | string | generated | Set when the task is created |
| `updatedAt` | string | generated | Updated on every change |

Clients cannot set `id`, `createdAt` or `updatedAt`. Unknown fields are ignored.

## Endpoints

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/health` | Check that the server runs | 200 |
| GET | `/api/tasks` | List tasks (filter, search, sort, paginate) | 200 |
| GET | `/api/tasks/stats` | Task statistics | 200 |
| GET | `/api/tasks/:id` | Get one task | 200 |
| POST | `/api/tasks` | Create a task | 201 |
| PUT | `/api/tasks/:id` | Update a task (at least one field) | 200 |
| PATCH | `/api/tasks/:id/status` | Update only the status | 200 |
| DELETE | `/api/tasks/:id` | Delete a task | 200 |

### Query parameters for `GET /api/tasks`

| Parameter | Values | Default |
|---|---|---|
| `status` | `pending`, `in-progress`, `completed` | none |
| `priority` | `low`, `medium`, `high` | none |
| `search` | any text (case-insensitive, in title and description) | none |
| `sortBy` | `createdAt`, `dueDate`, `priority`, `title` | `createdAt` |
| `order` | `asc`, `desc` | `asc` |
| `page` | integer, 1 or more | 1 |
| `limit` | integer, 1 to 100 | 10 |

Example:

```
GET /api/tasks?status=pending&priority=high&search=meeting&sortBy=createdAt&order=desc&page=1&limit=10
```

## Response format

Success:

```json
{ "success": true, "data": { } }
```

List responses also include pagination:

```json
{
  "success": true,
  "data": [ ],
  "pagination": { "page": 1, "limit": 10, "totalItems": 25, "totalPages": 3 }
}
```

Error:

```json
{ "success": false, "message": "Task not found" }
```

Validation errors also include the list of problems:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [ { "field": "title", "message": "title must be between 1 and 120 characters" } ]
}
```

| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Task created |
| 400 | Invalid input or malformed JSON |
| 404 | Task or route not found |
| 500 | Server or storage error (for example a

## Testing

I tested the API manually with PowerShell (`Invoke-RestMethod`) and the browser.

| Test | Expected result |
|---|---|
| Create a valid task | 201, task has generated `id`, defaults and timestamps |
| Create without title, with invalid status, priority or date | 400 with a list of errors |
| Send malformed JSON | 400, the server keeps running |
| Get an existing / a missing task | 200 / 404 |
| Update a task | 200, `id` and `createdAt` unchanged, `updatedAt` changed |
| Update with an empty body or invalid field | 400 |
| Change status with a valid / invalid value | 200 / 400 |
| Delete an existing / a missing task | 200 / 404 |
| Filter by status, priority, and both together | Only matching tasks |
| Search with different letter cases | Same results |
| Sort by `title`, `priority`, `dueDate`, `createdAt` | Correct order; tasks without `dueDate` last |
| `page=0`, `limit=-1`, `limit=abc`, `limit=101` | 400 |
| `page=999` | 200 with an empty list |
| `GET /api/tasks/stats` | Correct totals by status and priority |
| `data/tasks.json` missing | Created automatically, returns an empty list |
| `data/tasks.json` empty | Returns an empty list |
| `data/tasks.json` contains broken JSON | 500 with a clear message; the file is **not** overwritten |
| 20 simultaneous POST requests (`node test-concurrent.js`) | All 20 tasks are saved |

### Persistence

I created a task, stopped the server with Ctrl + C, started it again with