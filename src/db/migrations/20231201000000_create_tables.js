exports.up = function (knex) {
  return knex.schema
    .createTable("movies", (table) => {
      table.increments("movie_id").primary();
      table.string("title").notNullable();
      table.float("runtime_in_minutes").notNullable();
      table.string("rating").notNullable();
      table.text("description").notNullable();
      table.string("image_url").notNullable();
    })
    .createTable("critics", (table) => {
      table.increments("critic_id").primary();
      table.string("preferred_name").notNullable();
      table.string("surname").notNullable();
      table.string("organization_name").notNullable();
    })
    .createTable("reviews", (table) => {
      table.increments("review_id").primary();
      table.string("content").notNullable();
      table.float("score").notNullable();
          table.timestamps(true, true);
      table
        .integer("critic_id")
        .unsigned()
        .notNullable()
        .references("critic_id")
        .inTable("critics");
      table
        .integer("movie_id")
        .unsigned()
        .notNullable()
        .references("movie_id")
        .inTable("movies");
    })
    .createTable("theaters", (table) => {
      table.increments("theater_id").primary();
      table.string("name").notNullable();
      table.string("address_line_1").notNullable();
      table.string("address_line_2");
      table.string("city").notNullable();
      table.string("state").notNullable();
      table.string("zip").notNullable();
    })
    .createTable("movies_theaters", (table) => {
      table
        .integer("movie_id")
        .unsigned()
        .notNullable()
        .references("movie_id")
        .inTable("movies");
      table
        .integer("theater_id")
        .unsigned()
        .notNullable()
        .references("theater_id")
        .inTable("theaters");
      table.boolean("is_showing").notNullable().defaultTo(false);
      table.primary(["movie_id", "theater_id"]);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("movies_theaters")
    .dropTableIfExists("reviews")
    .dropTableIfExists("critics")
    .dropTableIfExists("theaters")
    .dropTableIfExists("movies");
};
