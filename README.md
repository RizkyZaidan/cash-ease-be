---

# Cash Ease Backend

A backend API for Cash Ease application.

---

## Prerequisites

- **Node.js** v23.7  
- **Browser** (for API testing with Postman or similar)  
- **Database Manager** (e.g., [DBeaver](https://dbeaver.io/) or [Navicat](https://www.navicat.com/))  

---

## How to Run

1. **Clone the repository**

```bash
git clone https://github.com/RizkyZaidan/cash-ease-be.git
cd cash-ease-be
```

2. **Locate these files in the root project directory:**

- `cash_ease_db.backup`  
- `Cash Ease.postman_collection.json`  
- `Cash Ease.postman_enviroment.json`  

> You can import the Postman collection and environment directly into Postman for API testing.

---

## Database Setup

1. Create a new database named `cash_ease_db` using your preferred database manager.

2. Restore the database using the `cash_ease_db.backup` file via the backup & restore wizard of your database manager.

---

## Project Setup

1. Rename `.env.example` file at the root of the project to `.env`.

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run start:dev
```

---

## Additional

To run the end-to-end tests, use the following command:

```bash
npm run test:e2e
```

---

Happy Coding! 🚀

---

## License

This project is licensed under the MIT License.
```

---
