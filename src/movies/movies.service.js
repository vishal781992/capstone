const db = require("../db/connection");

async function list() {
  return db("movies").select("movies.*");
}

async function listShowing() {
  return db("movies")
    .select("movies.*")
    .join(
      "movies_theaters",
      "movies.movie_id",
      "movies_theaters.movie_id"
    )
    .where({ "movies_theaters.is_showing": true })
    .groupBy("movies.movie_id");
}

async function read(movie_id) {
  return db("movies")
    .select("movies.*")
    .where({ "movies.movie_id": movie_id })
    .first();
}

module.exports = {
  list,
  listShowing,
  read,
};
