const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_flavors_db"
);
//make some constants so things work
const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));

//the routes for CRUD
//read all (rubric item 1)
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
//read one (rubric item 2)
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors WHERE id=$1`;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//create (rubric item 3) - curl to test: curl localhost:3000/api/flavors -X POST -d '{"name": "xyz", "is_favorite": true}' -H "Content-Type:application/json"
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
        INSERT INTO flavors(name, is_favorite) VALUES($1, $2) RETURNING *`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//update one (rubric item 5) curl to test: curl localhost:3000/api/flavors/2 -X PUT -d '{"name": "abc", "is_favorite": false}' -H "Content-Type:application/json"
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
            UPDATE flavors
            SET name=$1, is_favorite=$2
            WHERE id = $3
            RETURNING *`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//delete (rubric item 4)
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM flavors WHERE id=$1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

//init that yo
const init = async () => {
  await client.connect();
  console.log("connected to flavors db");
  let SQL = `
  DROP TABLE IF EXISTS flavors;
  CREATE TABLE flavors(
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    name VARCHAR(255),
    is_favorite BOOLEAN DEFAULT FALSE
  )`;
  await client.query(SQL);
  console.log("tables created");

  SQL = /*sql*/ `
  INSERT INTO flavors(name, is_favorite) VALUES('blood', true);
  INSERT INTO flavors(name, is_favorite) VALUES('sweat', false);
    INSERT INTO flavors(name, is_favorite) VALUES('tears', false);
    INSERT INTO flavors(name, is_favorite) VALUES('gasoline', true)
   `;
  await client.query(SQL);
  console.log("flavor table seeded");
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};
init();
