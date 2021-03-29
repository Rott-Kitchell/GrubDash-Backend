const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

const dishExists = (req, res, next) => {
  const { dishId } = req.params;

  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish === undefined) {
    return next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
  }
  res.locals.dish = foundDish;
  next();
};

const isValid = (req, res, next) => {
  const {
    data: { name, description, image_url, price },
  } = req.body;

  let problemArea = [];
  if (name === undefined || name === "") {
    problemArea.push("name");
  }
  if (description === undefined || description === "") {
    problemArea.push("description");
  }
  if (image_url === undefined || image_url === "") {
    problemArea.push("image_url");
  }
  if (price === undefined || !Number.isSafeInteger(price) || price < 1) {
    problemArea.push("price");
  }
  if (problemArea.length === 0) {
    return next();
  }
  next({
    status: 400,
    message: `please check this following inputs: ${problemArea}`,
  });
};

function list(req, res, next) {
  res.json({ data: dishes });
}

function create(req, res, next) {
  const {
    data: { name, description, image_url, price },
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    image_url,
    price,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  let foundDish = res.locals.dish;
  const { data: { id, name, description, image_url, price } = {} } = req.body;
  if (id) {
    if (foundDish.id !== id) {
      return next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${foundDish.id}, Route: ${id}`,
      });
    }
  }
  foundDish = {
    ...foundDish,
    name: name,
    description: description,
    image_url: image_url,
    price: price,
  };
  res.json({ data: foundDish });
}

// TODO: Implement the /dishes handlers needed to make the tests pass

module.exports = {
  list,
  create: [isValid, create],
  read: [dishExists, read],
  update: [dishExists, isValid, update],
};
