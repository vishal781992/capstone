const service = require("./theaters.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(request, response) {
  const { movieId } = request.params;
  const data = movieId
    ? await service.listForMovie(movieId)
    : await service.list();
  response.json({ data });
}

module.exports = {
  list: [asyncErrorBoundary(list)],
};
